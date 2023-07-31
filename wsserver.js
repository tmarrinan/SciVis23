const WebSocket = require('ws');

const port = process.env.PORT || 8000;

let rooms = {};
let wss = new WebSocket.Server({port: port});
wss.on('connection', (ws) => {
    let id = ws._socket.remoteAddress + ':' + ws._socket.remotePort;
    let room = '';
    console.log('New connection> ' + id);
    ws.on('message', (msg) => {
        let packet = JSON.parse(msg);
        if (packet.type === 'create') {
            if (rooms.hasOwnProperty(packet.data.id)) {
                ws.send(JSON.stringify({type: 'create', response: 'error'}));
            }
            else {
                room = packet.data.id;
                rooms[room] = {state: null, clients: {}};
                rooms[room].clients[id] = ws;
                ws.send(JSON.stringify({type: 'create', response: 'success'}));
            }
        }
        else if (packet.type === 'join') {
            if (rooms.hasOwnProperty(packet.data.id)) {
                room = packet.data.id;
                rooms[room].clients[id] = ws;
                ws.send(JSON.stringify({type: 'join', response: 'success'}));
            }
            else {
                ws.send(JSON.stringify({type: 'join', response: 'error'}));
            }
        }
        else if (packet.type === 'leave') {
            if (rooms.hasOwnProperty(packet.data.id)) {
                delete rooms[room].clients[id];
                if (Object.entries(rooms[room].clients).length === 0) {
                    delete rooms[room];
                }
                room = '';
            }
        }
        else if (packet.type === 'getState') {
            let state = null;
            if (room !== '') {
                state = rooms[room].state;
            }
            ws.send(JSON.stringify({type: 'updateState', data: state}));
        }
        else {
            if (packet.type === 'updateState') {
                rooms[room].state = packet.data;
            }
            broadcast(room, packet);
        }
    });
    ws.on('close', () => {
        if (room !== '') {
            delete rooms[room].clients[id];
            if (Object.entries(rooms[room].clients).length === 0) {
                delete rooms[room];
            }
            room = '';
        }
    });
});

function broadcast(room, message) {
    Object.values(rooms[room].clients).forEach((ws) => {
        ws.send(JSON.stringify(message));
    });
}
