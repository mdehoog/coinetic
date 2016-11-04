import StereoPannerNode from 'stereo-panner-node';

export default class Tones {
    constructor(voiceCount) {
        voiceCount = voiceCount || 8;

        if (!window.AudioContext) {
            return;
        }

        this.context = new AudioContext();
        this.voices = [];

        if (!this.context.createStereoPanner) {
            StereoPannerNode.polyfill();
        }

        for (let i = 0; i < voiceCount; i++) {
            const voice = this.voices[i] = {
                vco: this.context.createOscillator(),
                vca: this.context.createGain(),
                pan: this.context.createStereoPanner(),
                gain: 0,
                end: 0
            };
            voice.vco.start(0);
            voice.vco.type = 'sine';
            voice.vca.gain.value = 0;
            voice.vco.connect(voice.vca);
            voice.vca.connect(voice.pan);
            voice.pan.connect(this.context.destination);
        }
    }

    play(freq, gain, length, pan, type) {
        if (!this.context) {
            return;
        }

        type = type || 'sine';
        freq = Math.max(1, Math.min(this.context.sampleRate / 2, freq));

        let now = this.context.currentTime;
        let min = null;
        let voice = this.voices.find((v) => {
            min = (min && min.gain < v.gain) ? min : gain > v.gain ? v : null;
            return now >= v.end;
        });
        voice = voice || min;
        if (!voice) {
            return;
        }

        voice.vca.gain.cancelScheduledValues(0);
        voice.vco.frequency.cancelScheduledValues(0);
        voice.pan.pan.cancelScheduledValues(0);

        if (voice.end < now) {
            now += 0.01;
            voice.vca.gain.linearRampToValueAtTime(0, now);
        }

        voice.pan.pan.setValueAtTime(pan, now);
        voice.vco.frequency.setValueAtTime(freq, now);
        voice.vco.type = type;

        now += 0.01;
        voice.end = now + length;
        voice.gain = gain;
        voice.vca.gain.linearRampToValueAtTime(gain, now);
        voice.vca.gain.linearRampToValueAtTime(0, now + length);
    }
}