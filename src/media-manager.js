/**
 * MediaManager - 跨页面媒体互斥管理器（单例）
 *
 * 解决的问题：页面上同时存在多个可播放媒体（音乐播放器、视频、嵌入播放器等）时，
 * 播放其中一个会自动暂停其他媒体，避免声音重叠。
 *
 * 用法：
 *   const controller = {
 *       type: 'music',                       // 媒体类型标识
 *       play()   { ... },                    // 必需：开始播放
 *       pause()  { ... },                    // 必需：暂停播放
 *       stop()   { ... },                    // 可选：停止并复位（缺省回退到 pause）
 *       getElement() { return audioEl; }     // 可选：返回底层媒体元素
 *   };
 *   window.MediaManager.register('homepage-music', controller);
 *
 *   // 之后通过 MediaManager 请求播放/暂停，由它负责互斥：
 *   window.MediaManager.play('homepage-music');
 */

class MediaManager {
    constructor() {
        if (MediaManager.instance) {
            return MediaManager.instance;
        }
        MediaManager.instance = this;

        this.currentMedia = null;   // 当前正在播放的媒体 { id, type, startTime }
        this.controllers = new Map(); // id -> controller
        this.isPageVisible = !document.hidden;

        this._setupVisibilityListener();
    }

    static getInstance() {
        if (!MediaManager.instance) {
            MediaManager.instance = new MediaManager();
        }
        return MediaManager.instance;
    }

    /**
     * 注册一个媒体控制器
     * @param {string} id - 唯一标识
     * @param {object} controller - 控制器对象
     * @returns {string|undefined} 注册成功返回 type，失败返回 undefined
     */
    register(id, controller) {
        if (!id || !controller) {
            console.warn('[MediaManager] 注册失败：缺少 id 或 controller');
            return;
        }

        this.controllers.set(id, {
            id,
            type: controller.type || 'unknown',
            // bind 到 controller，保证内部 this 正确
            play: controller.play.bind(controller),
            pause: controller.pause.bind(controller),
            stop: controller.stop ? controller.stop.bind(controller) : controller.pause.bind(controller),
            getElement: controller.getElement ? controller.getElement.bind(controller) : () => null,
        });

        return controller.type;
    }

    /**
     * 注销一个媒体控制器；若它正在播放则先停止
     */
    unregister(id) {
        if (this.currentMedia && this.currentMedia.id === id) {
            this.stop(id);
        }
        this.controllers.delete(id);
    }

    /**
     * 请求播放指定媒体（自动暂停其他媒体）
     * @returns {boolean} 是否成功开始播放
     */
    play(id) {
        const controller = this.controllers.get(id);
        if (!controller) {
            console.warn(`[MediaManager] 未找到控制器: ${id}`);
            return false;
        }

        // 互斥：暂停当前正在播放的其他媒体
        if (this.currentMedia && this.currentMedia.id !== id) {
            this.pause(this.currentMedia.id);
        }

        try {
            controller.play();
            this.currentMedia = { id, type: controller.type, startTime: Date.now() };
            return true;
        } catch (err) {
            console.error(`[MediaManager] 播放失败: ${id}`, err);
            return false;
        }
    }

    /**
     * 暂停指定媒体
     */
    pause(id) {
        const controller = this.controllers.get(id);
        if (!controller) return;

        try {
            controller.pause();
            if (this.currentMedia && this.currentMedia.id === id) {
                this.currentMedia = null;
            }
        } catch (err) {
            console.error(`[MediaManager] 暂停失败: ${id}`, err);
        }
    }

    /**
     * 停止指定媒体
     */
    stop(id) {
        const controller = this.controllers.get(id);
        if (!controller) return;

        try {
            controller.stop();
            if (this.currentMedia && this.currentMedia.id === id) {
                this.currentMedia = null;
            }
        } catch (err) {
            console.error(`[MediaManager] 停止失败: ${id}`, err);
        }
    }

    /**
     * 停止所有已注册媒体
     */
    stopAll() {
        this.controllers.forEach((controller) => {
            try {
                controller.stop();
            } catch (err) {
                console.error(`[MediaManager] 停止失败: ${controller.id}`, err);
            }
        });
        this.currentMedia = null;
    }

    /**
     * 媒体自然播放结束时调用，用于清理 currentMedia 状态
     */
    onEnded(id) {
        if (this.currentMedia && this.currentMedia.id === id) {
            this.currentMedia = null;
        }
    }

    getCurrentMedia() {
        return this.currentMedia;
    }

    isPlaying(id) {
        return this.currentMedia && this.currentMedia.id === id;
    }

    /**
     * 页面不可见时自动暂停当前媒体，避免后台播放浪费资源/打扰用户
     */
    _setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            this.isPageVisible = !document.hidden;
            if (document.hidden && this.currentMedia) {
                this.pause(this.currentMedia.id);
            }
        });
    }
}

// 兼容 Node 环境（构建脚本不会执行到这里，仅为以防万一）
if (typeof window !== 'undefined') {
    window.MediaManager = MediaManager.getInstance();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaManager;
}
