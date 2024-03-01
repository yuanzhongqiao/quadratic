export class Input {
    ui;
    control;
    cli;
    constructor(ui, control, cli) {
        this.ui = ui;
        this.control = control;
        this.cli = cli;
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding("utf8");
        process.stdin.on("data", this.handleKey);
    }
    handleKey = (data) => {
        // uncomment to capture ctrl+letter keystroke values
        // console.log(JSON.stringify(data));
        // process.exit(0);
        switch (data.toString()) {
            case "q":
                this.control.quit();
                break;
            case "\u0003":
                this.control.quit();
                break; // ctrl + x
            case "h": // help
                this.ui.showHelp();
                break;
            case "H": // CLI help
                this.ui.showHelp(true);
                break;
            case "t": // toggle types
                this.control.restartTypes();
                break;
            case "c": // toggle core
                this.control.restartCore();
                break;
            case "m": // toggle multiplayer
                if (this.control.status.multiplayer === "killed") {
                    this.control.status.multiplayer = false;
                }
                this.control.restartMultiplayer();
                break;
            case "f": // toggle files
                if (this.control.status.files === "killed") {
                    this.control.status.files = false;
                }
                this.control.restartFiles();
                break;
            case "y": // toggle Python
                this.control.restartPython();
                break;
            case "p":
                this.control.togglePerf();
                break;
            case "a": // toggle API
                this.control.restartApi();
                break;
            case "l": // watch all
                if (this.cli.options.api != true) {
                    this.cli.options.api = true;
                    this.control.restartApi();
                }
                if (this.cli.options.core != true) {
                    this.cli.options.core = true;
                    this.control.restartCore();
                }
                if (this.cli.options.multiplayer != true) {
                    this.cli.options.multiplayer = true;
                    this.control.restartMultiplayer();
                }
                if (this.cli.options.files != true) {
                    this.cli.options.files = true;
                    this.control.restartFiles();
                }
                if (this.cli.options.python != true) {
                    this.cli.options.python = true;
                    this.control.restartPython();
                }
                break;
            case "A": // toggle showing API
                this.cli.options.hideAPI = !this.cli.options.hideAPI;
                break;
            case "C": // toggle showing Core
                this.cli.options.hideCore = !this.cli.options.hideCore;
                break;
            case "M": // toggle showing Multiplayer
                this.cli.options.hideMultiplayer = !this.cli.options.hideMultiplayer;
                break;
            case "F": // toggle showing Files
                this.cli.options.hideFiles = !this.cli.options.hideFiles;
                break;
            case "Y": // toggle showing Python
                this.cli.options.hidePython = !this.cli.options.hidePython;
                break;
            case "R": // toggle showing React
                this.cli.options.hideReact = !this.cli.options.hideReact;
                break;
            case "T": // toggle showing React
                this.cli.options.hideTypes = !this.cli.options.hideTypes;
                break;
            case "d": // toggle dark theme
                this.cli.options.dark = !this.cli.options.dark;
                break;
            case "r": // restart React
                this.control.runClient();
                break;
            case "\u0006": // ctrl + f
                this.control.killFiles();
                break;
            case "\r": // ctrl + m
                this.control.killMultiplayer();
                break;
        }
    };
}