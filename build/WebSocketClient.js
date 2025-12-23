'use strict';

class WebSocketClient {
    constructor(url) {
        this.url = url;
        this.ws = new WebSocket(url);
    }

    get onopen() {
        return this.ws.onopen;
    }

    set onopen(f) {
        this.ws.onopen = f;
    }

    get onclose() {
        return this.ws.onclose;
    }

    set onclose(f) {
        this.ws.onclose = f;
    }

    get onmessage() {
        return this.ws.onmessage;
    }

    set onmessage(f) {
        this.ws.onmessage = f;
    }

    get onerror() {
        return this.ws.onerror;
    }

    set onerror(f) {
        this.ws.onerror = f;
    }

    send(data) {
        this.ws.send(data);
    }

    close() {
        this.ws.close();
    }
}

module.exports = { WebSocketClient };