"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const cloudinary_service_1 = require("../services/cloudinary.service");
const messages_controller_1 = require("../controllers/messages.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authentifier);
router.post('/', messages_controller_1.demarrerConversation);
router.get('/', messages_controller_1.getMesConversations);
router.get('/:id', messages_controller_1.getMessages);
router.post('/:id/messages', cloudinary_service_1.uploadAudio, messages_controller_1.envoyerMessage);
exports.default = router;
//# sourceMappingURL=messages.routes.js.map