import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import Navbar from './Navbar.svelte';

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('Navbar Component', () => {
  let mockFetch;
  let mockGoto;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetch = vi.mocked(fetch);
    
    // Import goto mock
    const { goto } = await import('$app/navigation');
    mockGoto = vi.mocked(goto);
    
    // Reset console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render navbar with correct links', () => {
      render(Navbar);

      expect(screen.getByText('HelpingHand')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should have correct href attributes', () => {
      render(Navbar);

      const homeLink = screen.getByText('Home').closest('a');
      const projectsLink = screen.getByText('Projects').closest('a');
      const brandLink = screen.getByText('HelpingHand').closest('a');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(projectsLink).toHaveAttribute('href', '/projects');
      expect(brandLink).toHaveAttribute('href', '/');
    });

    it('should not show admin popup initially', () => {
      render(Navbar);

      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Enter admin password')).not.toBeInTheDocument();
    });
  });

  describe('Admin Popup', () => {
    it('should open admin popup when admin button is clicked', async () => {
      render(Navbar);

      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      expect(screen.getByText('Admin Access')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter admin password')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Proceed')).toBeInTheDocument();
    });

    it('should close admin popup when cancel button is clicked', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Close popup
      const cancelButton = screen.getByText('Cancel');
      await fireEvent.click(cancelButton);

      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });

    it('should close admin popup when close button (×) is clicked', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Close popup
      const closeButton = screen.getByLabelText('Close');
      await fireEvent.click(closeButton);

      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });

    it('should close admin popup when overlay is clicked', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Click overlay
      const overlay = screen.getByRole('dialog');
      await fireEvent.click(overlay);

      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });

    it('should close admin popup when Escape key is pressed', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Press Escape
      const overlay = screen.getByRole('dialog');
      await fireEvent.keyDown(overlay, { key: 'Escape' });

      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });
  });

  describe('Password Input', () => {
    it('should toggle password visibility', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      const eyeButton = screen.getByLabelText('Toggle password visibility');

      // Initially should be password type
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Click eye button to show password
      await fireEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'text');

      // Click again to hide password
      await fireEvent.click(eyeButton);
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should update password value when typing', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      
      await fireEvent.input(passwordInput, { target: { value: 'test123' } });
      expect(passwordInput).toHaveValue('test123');
    });

    it('should submit on Enter key press', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      });

      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      
      await fireEvent.input(passwordInput, { target: { value: 'admin123' } });
      await fireEvent.keyPress(passwordInput, { key: 'Enter' });

      expect(mockFetch).toHaveBeenCalledWith('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });
    });
  });

  describe('Admin Login', () => {
    it('should show error when password is empty', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      const proceedButton = screen.getByText('Proceed');
      await fireEvent.click(proceedButton);

      expect(screen.getByText('Please enter password')).toBeInTheDocument();
    });

    it('should handle successful login', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true })
      });

      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      await fireEvent.input(passwordInput, { target: { value: 'admin123' } });

      // Submit
      const proceedButton = screen.getByText('Proceed');
      await fireEvent.click(proceedButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: 'admin',
            password: 'admin123'
          })
        });
      });

      await waitFor(() => {
        expect(mockGoto).toHaveBeenCalledWith('/admin');
      });

      // Popup should be closed
      expect(screen.queryByText('Admin Access')).not.toBeInTheDocument();
    });

    it('should handle login failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ error: 'Invalid password' })
      });

      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      await fireEvent.input(passwordInput, { target: { value: 'wrongpassword' } });

      // Submit
      const proceedButton = screen.getByText('Proceed');
      await fireEvent.click(proceedButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid password')).toBeInTheDocument();
      });

      // Popup should still be open
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      await fireEvent.input(passwordInput, { target: { value: 'admin123' } });

      // Submit
      const proceedButton = screen.getByText('Proceed');
      await fireEvent.click(proceedButton);

      await waitFor(() => {
        expect(screen.getByText('Network error. Please try again.')).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      // Mock a delayed response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: vi.fn().mockResolvedValue({ success: true })
          }), 100)
        )
      );

      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Enter password
      const passwordInput = screen.getByPlaceholderText('Enter admin password');
      await fireEvent.input(passwordInput, { target: { value: 'admin123' } });

      // Submit
      const proceedButton = screen.getByText('Proceed');
      await fireEvent.click(proceedButton);

      // Should show loading state
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
      expect(passwordInput).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(mockGoto).toHaveBeenCalledWith('/admin');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'admin-popup-title');

      const title = screen.getByText('Admin Access');
      expect(title).toHaveAttribute('id', 'admin-popup-title');

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toBeInTheDocument();

      const eyeButton = screen.getByLabelText('Toggle password visibility');
      expect(eyeButton).toBeInTheDocument();
    });

    it('should not propagate click events from popup content', async () => {
      render(Navbar);

      // Open popup
      const adminButton = screen.getByText('Admin');
      await fireEvent.click(adminButton);

      // Click inside popup content (should not close)
      const popupContent = screen.getByRole('document');
      await fireEvent.click(popupContent);

      // Popup should still be open
      expect(screen.getByText('Admin Access')).toBeInTheDocument();
    });
  });
});