import { Router } from 'express';
import { authentifier } from '../middleware/auth.middleware';
import { uploadAudio } from '../services/cloudinary.service';
import { 
  demarrerConversation, 
  getMesConversations, 
  getMessages, 
  envoyerMessage 
} from '../controllers/messages.controller';

const router = Router();

router.use(authentifier);

router.post('/', demarrerConversation);
router.get('/', getMesConversations);
router.get('/:id', getMessages);
router.post('/:id/messages', uploadAudio, envoyerMessage);

export default router;
