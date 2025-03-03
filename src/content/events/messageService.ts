import { LoggerService } from '../../shared/services/loggerService';

/**
 * Interface for all messages sent between content and background scripts
 */
export interface Message {
    action: string;
    [key: string]: any;
}

/**
 * Service for sending messages between content and background scripts
 */
export class MessageService {
    private static instance: MessageService;
    private readonly logger = LoggerService.getInstance();
    private messageHandlers: Map<string, (message: Message) => Promise<any>> = new Map();

    private constructor() {
        // Set up message listener
        chrome.runtime.onMessage.addListener(this.handleIncomingMessage.bind(this));
    }

    /**
     * Get the singleton instance of the message service
     */
    public static getInstance(): MessageService {
        if (!MessageService.instance) {
            MessageService.instance = new MessageService();
        }
        return MessageService.instance;
    }

    /**
     * Send a message to the background script
     */
    public async sendMessage(message: Message): Promise<any> {
        try {
            this.logger.debug('Sending message:', message);
            const response = await chrome.runtime.sendMessage(message);
            this.logger.debug('Received response:', response);
            return response;
        } catch (error) {
            this.logger.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Register a handler for a specific message action
     */
    public registerHandler(action: string, handler: (message: Message) => Promise<any>): void {
        this.messageHandlers.set(action, handler);
        this.logger.debug(`Registered handler for action: ${action}`);
    }

    /**
     * Remove a handler for a specific message action
     */
    public removeHandler(action: string): void {
        this.messageHandlers.delete(action);
        this.logger.debug(`Removed handler for action: ${action}`);
    }

    /**
     * Handle incoming messages and route to appropriate handler
     */
    private handleIncomingMessage(message: Message, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void): boolean {
        if (!message || !message.action) {
            this.logger.warn('Received invalid message:', message);
            sendResponse({ success: false, error: 'Invalid message format' });
            return false;
        }

        this.logger.debug('Received message:', message);

        const handler = this.messageHandlers.get(message.action);

        if (!handler) {
            this.logger.debug(`No handler registered for action: ${message.action}`);
            sendResponse({ success: false, error: `No handler for action: ${message.action}` });
            return false;
        }

        // Process with handler and send response
        handler(message)
            .then(result => {
                this.logger.debug('Handler result:', result);
                sendResponse({ success: true, data: result });
            })
            .catch(error => {
                this.logger.error(`Error handling message for action ${message.action}:`, error);
                sendResponse({
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            });

        // Return true to indicate we'll use sendResponse asynchronously
        return true;
    }
}
