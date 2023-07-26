package com.example.P2PVoIP;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@Controller
class SignalController {

    @PostMapping("/signal")
    public String signal(@RequestBody String signal) {
        // handle the signal here. This is a simplification. In reality, you need to route the signal to the other user.
        return signal;
    }

    @MessageMapping("/signal")
    @SendTo("/topic/signal")
    public SignalMessage signal(SignalMessage message) throws Exception {
        // In a real application, you'd need more complex logic here to route the signal to the correct user.
        return message;
    }

}
