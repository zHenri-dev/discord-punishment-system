module.exports = class {
    constructor(client) {
        this.client = client;
        this.eventName = "ready";
    }

    async run() {
        this.client.user.setActivity(`Desenvolvido por zHenri_`);
        let finishedAt = performance.now();
        let time = (parseFloat(finishedAt - this.client.startedAt).toFixed(2)).replace(".00", "");
        this.client.functions.checkPunishments();
        setInterval(() => {
            this.client.functions.checkPunishments();
        }, 60000);
        console.log(`\x1b[38;5;75m[${this.client.user.username}] Conexão com o Discord efetuada em ${time}ms\x1b[0m`);
    }
};