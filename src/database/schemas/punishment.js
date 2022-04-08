const { Schema, model } = require("mongoose");

const punishmentSchema = Schema({
    userId: String,
    authorId: String,
    guildId: String,
    logGuildId: String,
    logChannelId: String,
    logMessageId: String,
    reason: String,
    type: String,
    time: Number,
    proof: String,
    createdAt: Number,
    performed: Boolean
})

module.exports = model("Punishment", punishmentSchema);