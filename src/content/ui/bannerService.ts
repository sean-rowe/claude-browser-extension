/**
 * Types of notifications that can be shown
 */
export type NotificationType = 'success' | 'error' | 'info' | 'warning';

/**
 * Service for showing notification banners in the UI
 */
export class BannerService {
    private static instance: BannerService;
    private activeNotifications: Set<HTMLElement> = new Set();
    private notificationContainer: HTMLElement | null = null;
    private notificationDuration = 3000; // ms

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Get the singleton instance of the banner service
     */
    public static getInstance(): BannerService {
        if (!BannerService.instance) {
            BannerService.instance = new BannerService();
        }
        return BannerService.instance;
    }

    /**
     * Set the default duration for notifications
     */
    public setNotificationDuration(durationMs: number): void {
        if (durationMs > 0) {
            this.notificationDuration = durationMs;
        }
    }

    /**
     * Show a success notification
     */
    public showSuccess(message: string, duration?: number): void {
        this.showNotification(message, 'success', duration);
    }

    /**
     * Show an error notification
     */
    public showError(message: string, duration?: number): void {
        this.showNotification(message, 'error', duration);
    }

    /**
     * Show an info notification
     */
    public showInfo(message: string, duration?: number): void {
        this.showNotification(message, 'info', duration);
    }

    /**
     * Show a warning notification
     */
    public showWarning(message: string, duration?: number): void {
        this.showNotification(message, 'warning', duration);
    }

    /**
     * Show a notification banner
     */
    private showNotification(
        message: string,
        type: NotificationType = 'info',
        duration?: number
    ): void {
        this.ensureContainer();

        // Create notification element
        const notification = this.createNotificationElement(message, type);

        // Add to container
        this.notificationContainer!.appendChild(notification);
        this.activeNotifications.add(notification);

        // Trigger animation
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);

        // Auto-remove after duration
        const timeoutDuration = duration ?? this.notificationDuration;
        // Store timeout ID for cleanup
        (notification as any)._removeTimeout = setTimeout(() => {
            this.removeNotification(notification);
        }, timeoutDuration);

        // Add click handler to dismiss
        notification.addEventListener('click', () => {
            clearTimeout((notification as any)._removeTimeout);
            this.removeNotification(notification);
        });
    }

    /**
     * Create a notification element
     */
    private createNotificationElement(message: string, type: NotificationType): HTMLElement {
        const notification = document.createElement('div');
        notification.className = `artifact-notification artifact-notification-${type}`;
        notification.setAttribute('role', 'alert');

        // Add base styling
        Object.assign(notification.style, {
            padding: '12px 16px',
            margin: '0 0 8px 0',
            borderRadius: '6px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontSize: '14px',
            lineHeight: '1.5',
            display: 'flex',
            alignItems: 'center',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            cursor: 'pointer',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            position: 'relative'
        });

        // Add type-specific styling
        const typeStyles = {
            success: {
                backgroundColor: '#ecfdf5',
                color: '#065f46',
                borderLeft: '4px solid #10b981'
            },
            error: {
                backgroundColor: '#fef2f2',
                color: '#991b1b',
                borderLeft: '4px solid #ef4444'
            },
            info: {
                backgroundColor: '#eff6ff',
                color: '#1e40af',
                borderLeft: '4px solid #3b82f6'
            },
            warning: {
                backgroundColor: '#fffbeb',
                color: '#92400e',
                borderLeft: '4px solid #f59e0b'
            }
        };

        Object.assign(notification.style, typeStyles[type]);

        // Add icon
        const icon = document.createElement('span');
        icon.style.marginRight = '12px';

        const iconPaths: Record<string, string> = {
            success: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            `,
            error: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            `,
            info: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
            `,
            warning: `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                    <line x1="12" y1="9" x2="12" y2="13"></line>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
            `
        };

        icon.innerHTML = iconPaths[type];
        notification.appendChild(icon);

        // Add message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        notification.appendChild(messageSpan);

        return notification;
    }

    /**
     * Remove a notification with animation
     */
    private removeNotification(notification: HTMLElement): void {
        // Don't remove if already being removed
        if (notification.classList.contains('removing')) {
            return;
        }

        // Add removing class to prevent duplicate removal
        notification.classList.add('removing');

        // Animate out
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';

        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.activeNotifications.delete(notification);

            // Clean up container if no more notifications
            if (this.activeNotifications.size === 0 && this.notificationContainer) {
                this.notificationContainer.remove();
                this.notificationContainer = null;
            }
        }, 300);
    }

    /**
     * Ensure notification container exists
     */
    private ensureContainer(): void {
        if (!this.notificationContainer) {
            this.notificationContainer = document.createElement('div');
            this.notificationContainer.className = 'artifact-notification-container';

            // Style the container
            Object.assign(this.notificationContainer.style, {
                position: 'fixed',
                top: '16px',
                right: '16px',
                zIndex: '10000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                maxWidth: '350px',
                pointerEvents: 'none' // Allow clicking through the container
            });

            // Make notifications themselves clickable
            const style = document.createElement('style');
            style.textContent = `
                .artifact-notification {
                    pointer-events: auto;
                }
            `;
            this.notificationContainer.appendChild(style);

            document.body.appendChild(this.notificationContainer);
        }
    }

    /**
     * Clear all notifications
     */
    public clearAll(): void {
        if (!this.notificationContainer) return;

        // Clear all timeouts
        this.activeNotifications.forEach(notification => {
            if ((notification as any)._removeTimeout) {
                clearTimeout((notification as any)._removeTimeout);
            }
        });

        // Remove container and reset state
        this.notificationContainer.remove();
        this.notificationContainer = null;
        this.activeNotifications.clear();
    }
}
