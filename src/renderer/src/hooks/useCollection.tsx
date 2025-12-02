// ============================================================================
// useCollection Hook - REFACTORED with Hook Composition
// Reduced from 868 lines to ~150 lines using hook composition
// ============================================================================

// Import the combined hook from collection directory
export { useCollection, useDataSources, useWorkflowExecutions } from './collection/index.js'

// ============================================================================
// Hook Architecture Summary
// ============================================================================

/**
 * REFACTORING RESULTS:
 *
 * BEFORE: Single 868-line monolithic hook managing everything
 * AFTER: Composed of multiple focused hooks with backward compatibility
 *
 * Specialized Hooks Created:
 * 1. useDataSources.ts - Data source CRUD operations
 * 2. useWorkflowExecutions.ts - Workflow execution management
 *
 * Benefits:
 * - Reduced main hook from 868 to ~150 lines (83% reduction)
 * - Improved separation of concerns
 * - Better reusability
 * - Easier to test individual hooks
 * - Enhanced maintainability
 * - Backward compatibility maintained
 *
 * Files Structure:
 * src/renderer/src/hooks/
 * ├── useCollection.tsx (MAIN - refactored, re-exports)
 * ├── useCollection.tsx.backup (ORIGINAL - 868 lines)
 * └── collection/
 *     ├── useDataSources.ts
 *     ├── useWorkflowExecutions.ts
 *     └── index.ts (combined hook with legacy compatibility)
 *
 * Migration Path:
 * 1. Existing components continue to work (backward compatible)
 * 2. New components can use specialized hooks directly
 * 3. Gradual migration to individual hooks over time
 * 4. Legacy wrapper can be removed in future major version
 */
