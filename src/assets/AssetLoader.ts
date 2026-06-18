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
    ];

    private images = new Map<string, HTMLImageElement>();

    public async init(): Promise<void> {
        await Promise.all(
            this.IMAGE_NAMES.map(fileName =>
                this.loadImage(fileName, `${this.IMAGE_FOLDER}${fileName}`),
            ),
        );
    }

    public getImage(imageName: string): HTMLImageElement {
        const image = this.images.get(imageName);

        if (image === undefined) {
            throw new Error(`${imageName} image not found`);
        }
        return image;
    }

    private loadImage(name: string, src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const img = new Image();

            img.onload = (): void => {
                this.images.set(name, img);
                resolve();
            };

            img.onerror = (): void => reject(new Error(`Failed to load image: ${src}`));

            img.src = src;
        });
    }
}
