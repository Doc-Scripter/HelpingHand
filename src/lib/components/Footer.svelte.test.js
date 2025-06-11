import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer Component', () => {
  describe('Rendering', () => {
    it('should render footer with correct content', () => {
      render(Footer);

      // Check for main footer text with current year
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(`© ${currentYear} HelpingHand. All rights reserved.`)).toBeInTheDocument();
    });

    it('should render with correct semantic structure', () => {
      const { container } = render(Footer);
      
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
      
      const footerContent = container.querySelector('.footer-content');
      expect(footerContent).toBeInTheDocument();
    });

    it('should render navigation links', () => {
      render(Footer);

      expect(screen.getByText('About Us')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Contact')).toBeInTheDocument();
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    });

    it('should have correct href attributes for navigation links', () => {
      render(Footer);

      const aboutLink = screen.getByText('About Us').closest('a');
      const projectsLink = screen.getByText('Projects').closest('a');
      const contactLink = screen.getByText('Contact').closest('a');
      const privacyLink = screen.getByText('Privacy Policy').closest('a');

      expect(aboutLink).toHaveAttribute('href', '/about');
      expect(projectsLink).toHaveAttribute('href', '/projects');
      expect(contactLink).toHaveAttribute('href', '/contact');
      expect(privacyLink).toHaveAttribute('href', '/privacy');
    });
  });

  describe('Content', () => {
    it('should display current year dynamically', () => {
      render(Footer);
      
      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('should contain HelpingHand branding', () => {
      render(Footer);
      
      expect(screen.getByText(/HelpingHand/)).toBeInTheDocument();
    });

    it('should have navigation structure', () => {
      const { container } = render(Footer);
      
      const nav = container.querySelector('nav');
      const ul = container.querySelector('nav ul');
      const listItems = container.querySelectorAll('nav ul li');

      expect(nav).toBeInTheDocument();
      expect(ul).toBeInTheDocument();
      expect(listItems).toHaveLength(4);
    });
  });

  describe('Accessibility', () => {
    it('should be accessible as a footer landmark', () => {
      const { container } = render(Footer);
      
      const footer = container.querySelector('footer');
      expect(footer).toBeInTheDocument();
    });

    it('should have accessible navigation', () => {
      const { container } = render(Footer);
      
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
    });

    it('should have readable text content', () => {
      render(Footer);
      
      const currentYear = new Date().getFullYear();
      const footerText = screen.getByText(`© ${currentYear} HelpingHand. All rights reserved.`);
      expect(footerText).toBeVisible();
    });

    it('should have accessible links', () => {
      render(Footer);
      
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(4);
      
      links.forEach(link => {
        expect(link).toBeVisible();
        expect(link).toHaveAttribute('href');
      });
    });
  });
});