class Main {

    public init(): void {
        this.closeLoadingWindow();
    }

    private closeLoadingWindow(): void {
        const element = document.getElementById("loadingDiv");

        element!.style.opacity = "0";
        element!.addEventListener("transitionend", function onTransitionEnd() {
            element!.style.display = "none";
            element!.removeEventListener("transitionend", onTransitionEnd);
        }, { once: true });   

        this.showMainMenu();
    }

    private showMainMenu(): void {
        document.getElementById("menuCanvas")!.style.display = "block";
    }
}

const main = new Main();
main.init();