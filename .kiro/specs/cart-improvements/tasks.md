# Implementation Plan

- [x] 1. Implement minimum order value validation in CartSidebar
  - Add MINIMUM_ORDER_VALUE constant (99 rupees)
  - Calculate whether cart meets minimum order value
  - Add conditional logic to disable checkout button when below minimum
  - Create and style minimum order warning message component
  - Display remaining amount needed to meet minimum
  - Add CSS styles for `.minimumOrderWarning` in CartSidebar.module.css
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Replace browser alerts with inline validation feedback
- [x] 2.1 Add validation state management to CartSidebar
  - Create ValidationErrors interface with location and slot fields
  - Add validationErrors state to CartSidebar component
  - Update processCheckout to set validation errors instead of using alert()
  - Add logic to clear errors when user makes selections
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 2.2 Update LocationSelector to display validation errors
  - Add error and onErrorClear props to LocationSelector interface
  - Render error message below select element when error exists
  - Add error state styling to select element
  - Call onErrorClear when user changes selection
  - Add CSS styles for `.errorMessage` and `.selectError` in LocationSelector.module.css
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 2.3 Update SlotSelector to display validation errors
  - Add error and onErrorClear props to SlotSelector interface
  - Render error message below select element when error exists
  - Add error state styling to select element
  - Call onErrorClear when user changes selection
  - Add CSS styles for `.errorMessage` and `.selectError` in SlotSelector.module.css
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 2.4 Wire validation errors from CartSidebar to selectors
  - Pass location error and clear handler to LocationSelector
  - Pass slot error and clear handler to SlotSelector
  - Ensure errors display when checkout attempted without selections
  - Verify errors clear when user makes selections
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 3. Clean up OrderSuccessToast component
  - Remove order ID display section from JSX
  - Remove `.orderId`, `.label`, and `.id` CSS classes from OrderSuccessToast.module.css
  - Adjust spacing on `.message` class (increase bottom margin to 24px)
  - Verify single "Got it!" button remains
  - Test popup appearance and auto-close functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
