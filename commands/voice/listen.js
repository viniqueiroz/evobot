const vosk = require('vosk');
vosk.setLogLevel(-1);
module.exports = {
    async execute(voiceConnection, mapKey = null) {
        const model = new vosk.Recognizer({ model: new vosk.Model(`vosk_models/${'en'}`), sampleRate: 48000 })

        voiceConnection.on('speaking', async (user, speaking) => {
            if (speaking.bitfield == 0 || user.bot) {
                return
            }
            console.log(`I'm listening to ${user.username}`)
            // this creates a 16-bit signed PCM, stereo 48KHz stream
            const audioStream = voiceConnection.receiver.createStream(user, { mode: 'pcm' })
            audioStream.on('error', (e) => {
                console.log('audioStream: ' + e)
            });
            let buffer = [];

            audioStream.on('data', (data) => {
                buffer.push(data)
            })

            audioStream.on('end', async () => {
                buffer = Buffer.concat(buffer)
                const duration = buffer.length / 48000 / 4;
                console.log("duration: " + duration)

                try {
                    let new_buffer = await convert_audio(buffer)

                    model.acceptWaveform(new_buffer);
                    let ret = model.result().text;
                    console.log('vosk:', ret)
                    // if (out != null)
                    //     process_commands_query(out, mapKey, user);
                } catch (e) {
                    console.log('tmpraw rename: ' + e)
                }
            })
        })
    }
}

async function convert_audio(input) {
    try {
        // stereo to mono channel
        const data = new Int16Array(input)
        const ndata = data.filter((el, idx) => idx % 2);
        return Buffer.from(ndata);
    } catch (e) {
        console.log(e)
        console.log('convert_audio: ' + e)
        throw e;
    }
}