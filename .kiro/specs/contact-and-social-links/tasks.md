# Implementation Plan

- [x] 1. Create ContactSection component for menu page
  - Create `src/components/ContactSection.tsx` with phone and Instagram links
  - Create `src/components/ContactSection.module.css` with neo-brutalist styling
  - Use tel: link for phone number (9674778549)
  - Use Instagram link (https://www.instagram.com/p_k_chai) with target="_blank" and rel="noopener noreferrer"
  - Include emoji icons (📞 and 📷) for visual indicators
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Integrate ContactSection into MenuList component
  - Import ContactSection in `src/components/MenuList.tsx`
  - Add ContactSection after all CategorySection components
  - Verify it appears at the bottom of the menu
  - _Requirements: 1.1_

- [x] 3. Make phone numbers clickable in admin dashboard
  - Modify `src/app/admin/page.tsx` to wrap phone numbers in tel: links
  - Update customerPhone display in expanded block details section
  - Add hover styles to `src/app/admin/page.module.css` for phone links
  - Ensure cursor pointer and underline on hover
  - _Requirements: 2.1, 2.2, 2.3_
