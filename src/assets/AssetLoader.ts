export class AssetLoader {
    private readonly IMAGE_FOLDER: string = "images/";
    private readonly IMAGE_NAMES: Array<string> = [
        "balls.png",
        "field.png",
        "track.jpg",
        "RedParticle.png",
        "digits.png",
        "goal_field.png",
        "star.png",
        "play.png",
        "multiplayer.png",
        "single.png",
    ];

    private static _instance: AssetLoader;
    private images = new Map<string, HTMLImageElement>();

    async init(): Promise<void> {
        await Promise.all(
            this.IMAGE_NAMES.map(fileName =>
                this.loadImage(fileName, `${this.IMAGE_FOLDER}${fileName}`),
            ),
        );
    }

    public static getInstance(): AssetLoader {
        return this._instance || (this._instance = new this());
    }

    public getImage(imageName: string): HTMLImageElement {
        let image = this.images.get(imageName);
        if (image === undefined) {
            throw new Error(imageName + " image not found");
        }
        return image;
    }

    private loadImage(name: string, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = () => {
                this.images.set(name, img);
                resolve();
            };

            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));

            img.src = src;
        });
    }
}
