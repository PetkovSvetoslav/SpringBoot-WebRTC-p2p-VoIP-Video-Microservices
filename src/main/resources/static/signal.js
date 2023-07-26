// Get local media stream
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = stream;
        }

        // Set up STOMP over WebSocket
        const socket = new SockJS('/signal');
        const stompClient = Stomp.over(socket);

        stompClient.connect({}, function (frame) {
            console.log('Connected: ' + frame);
            stompClient.subscribe('/topic/signal', function (signal) {
                const message = JSON.parse(signal.body);

                if (message.type === 'offer') {
                    receiveOffer(message);
                } else if (message.type === 'answer') {
                    receiveAnswer(message);
                } else if (message.type === 'candidate') {
                    receiveCandidate(new RTCIceCandidate(message.candidate));
                }
            });
        });

        // Set up RTCPeerConnection
        const peerConnection = new RTCPeerConnection();
        // const peerConnection = new RTCPeerConnection({
        //     iceServers: [
        //         {
        //             urls: 'stun:stun.l.google.com:19302'
        //         }
        //     ]
        // });


        stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

        // Send ICE candidates to the other user
        peerConnection.onicecandidate = ({ candidate }) => {
            if (candidate) {
                stompClient.send("/app/signal", {}, JSON.stringify({ 'type': 'candidate', 'candidate': candidate }));
            }
        };

        // When you're ready to start the call:
        peerConnection.createOffer()
            .then(offer => peerConnection.setLocalDescription(offer))
            .then(() => {
                stompClient.send("/app/signal", {}, JSON.stringify({ 'type': 'offer', 'offer': peerConnection.localDescription }));
            });

        // When you receive an offer from the other user:
        function receiveOffer(offer) {
            peerConnection.setRemoteDescription(offer)
                .then(() => peerConnection.createAnswer())
                .then(answer => peerConnection.setLocalDescription(answer))
                .then(() => {
                    stompClient.send("/app/signal", {}, JSON.stringify({ 'type': 'answer', 'answer': peerConnection.localDescription }));
                });
        }

        // When you receive an answer from the other user:
        function receiveAnswer(answer) {
            peerConnection.setRemoteDescription(answer);
        }

        // When you receive an ICE candidate from the other user:
        function receiveCandidate(candidate) {
            peerConnection.addIceCandidate(candidate);
        }
    })
    .catch(error => console.error('Error accessing media devices.', error));
