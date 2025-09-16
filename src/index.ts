import { Assets, Sprite, Texture } from "pixi.js";

import lottie, { type AnimationItem } from "lottie-web";

type LottieOptions = {
  /** Lottie动画文件路径 */
  asset: string | Uint8Array;
  /** 是否自动播放 */
  autoplay?: boolean;
  /** 是否循环播放 */
  loop?: boolean;

  width?: number;

  height?: number;

  /** lottie 播放速度 */
  speed?: number;
};

/**
 * LottieSprite
 * @description Lottie动画精灵
 * @example
 * const lottieSprite = new LottieSprite({
 *  asset: "lottie.json",
 * autoplay: true,
 * loop: true,
 * width: 100,
 * height: 100,
 * speed: 1,
 * });
 * app.stage.addChild(lottieSprite);
 * lottieSprite.play();
 * lottieSprite.stop();
 * lottieSprite.destroy();
 */
export class LottieSprite extends Sprite {
  private _lottieAnimation?: AnimationItem;
  private _file?: File | Uint8Array;
  private _canvas?: OffscreenCanvas | HTMLCanvasElement;
  private _playing = false;

  onCompleted?: () => void;
  onProgress?: (progress: number) => void;
  enterFrame?: (currentFrame: number) => void;

  private constructor(options: LottieOptions) {
    const width = (options.width ?? 100) * window.devicePixelRatio || 2;
    const height = (options.height ?? 100) * window.devicePixelRatio || 2;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = width;
    tempCanvas.height = height;

    super({ texture: Texture.from(tempCanvas) });

    this._canvas = tempCanvas;
  }

  static async create(options: LottieOptions) : Promise<LottieSprite | undefined> {
    const lottieSprite = new LottieSprite(options);
    try {
      await lottieSprite.initLottie(options);
      lottieSprite._lottieAnimation?.addEventListener("DOMLoaded", () => {
        if (lottieSprite._lottieAnimation) {
          lottieSprite._playing = options.autoplay ?? false;
          lottieSprite._lottieAnimation.addEventListener("enterFrame", () => {
            lottieSprite.texture.source.update();
           });
         }
       });
      lottieSprite.initEvent();
    } catch (error) { 
      console.error(error);
      return;
    }
    return lottieSprite;
  }

  private async initLottie(options: LottieOptions) {
    this._file =
      typeof options.asset === "string"
        ? await Assets.load(options.asset)
        : options.asset;

    this.width = options.width ?? 100;
    this.height = options.height ?? 100;

    // 初始化Lottie动画
    this._lottieAnimation = lottie.loadAnimation<"canvas">({
      renderer: "canvas",
      loop: options.loop ?? false,
      autoplay: options.autoplay ?? false,
      animationData: this._file,
      rendererSettings: {
        context: this._canvas?.getContext("2d"),
        clearCanvas: true,
      },
    } as any);
    if (options.speed) {
      this._lottieAnimation.setSpeed(options.speed || 1);
    }
  }

  private initEvent() {
    // 当动画播放完成时触发
    this._lottieAnimation?.addEventListener("complete", () => {
      this._playing = false;
      this.onCompleted?.();
    });

    // onProgress
    this._lottieAnimation?.addEventListener("enterFrame", () => {
      if (this._lottieAnimation) {
        this.enterFrame?.(this._lottieAnimation?.currentFrame);

        this.onProgress?.(
          (this._lottieAnimation?.currentFrame /
            this._lottieAnimation?.totalFrames) *
            100 || 0,
        );
      }
    });
  }

  get currentFrame() {
    return this._lottieAnimation?.currentFrame || 0;
  }

  play() {
    this._playing = true;
+   this._lottieAnimation?.goToAndPlay(this.currentFrame, true);
  }

  stop() {
    this._playing = false;
+    this._lottieAnimation?.stop();
  }

  pause() {
    this._playing = false;
    this._lottieAnimation?.pause();
  }
  
  setSpeed(speed: number) { 
    this._lottieAnimation?.setSpeed(speed);
  }

  goToAndStop(value: number, isFrame:boolean = false) { 
    this._playing = false;
    this._lottieAnimation?.goToAndStop(value, isFrame);
  } 
  
  goToAndPlay(value: number, isFrame:boolean = false) { 
    this._playing = true;
    this._lottieAnimation?.goToAndPlay(value, isFrame);
  }

  setDirection(direction: number) { 
    this._lottieAnimation?.setDirection(direction);
  }

  playSegments(segments: number[] | number[][], forceFlag: boolean = true) { 
    this._playing = true;
    this._lottieAnimation?.playSegments(segments, forceFlag);
  }

  getDuration(inFrames: boolean = false) { 
    return this._lottieAnimation?.getDuration(inFrames) ?? 0;
  }

  destroy() {
    this.stop();
    this._lottieAnimation?.destroy();
  }
}
