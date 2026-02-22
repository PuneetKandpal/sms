# JSON Diff Engine

A comprehensive React-based diffing engine similar to Cursor IDE's review system for comparing and merging JSON objects with field-by-field accept/reject functionality.

## Features

- 🔍 **Deep Object Comparison** - Recursively compares nested objects and arrays
- 🎨 **Visual Diff Interface** - Color-coded changes with intuitive UI
- ✅ **Accept/Reject Controls** - Field-by-field decision making
- 📊 **Progress Tracking** - Real-time statistics and progress bars
- 🔄 **Live Preview** - See merged results in real-time
- 📥 **Export Functionality** - Download merged results as JSON
- 🏗️ **Modular Components** - Reusable components for different use cases

## Components

### `DiffViewer`
The main component for comparing two objects.

```jsx
import { DiffViewer } from './components/diff';

<DiffViewer
  oldObject={previousData}
  newObject={latestData}
  title="Data Comparison"
  onMergedObjectChange={(merged) => console.log(merged)}
/>
```

### `SourcesDiffViewer`
Specialized component for JBI API sources array comparison.

```jsx
import { SourcesDiffViewer } from './components/diff';

<SourcesDiffViewer
  sources={apiResponse.sources}
  title="Sources Comparison"
  onMergedSourceChange={(merged) => handleMergedSource(merged)}
/>
```

### `SourceComparisonView`
Custom UI component for comparing JBI API sources with section-by-section accept/reject workflow. Matches the existing application theme and UX patterns.

```jsx
import { SourceComparisonView } from './components/diff';

<SourceComparisonView
  oldObject={firstSource}
  newObject={lastSource}
  title="Source Comparison: Project Name"
  onDecisionChange={(decisions) => handleUserDecisions(decisions)}
/>
```

**Features:**
- 🎯 **Targeted Sections** - Compares specific JBI sections: industries, buyer_personas, products_and_services, target_markets, differentiators, geo_leo_strategy
- 📝 **Overview & Items** - Compares both overview text and list items within each section
- ✅ **Accept/Reject UI** - Check/cross icon buttons for each change
- 🎨 **Theme Integration** - Matches OverviewSection.js UI theme and color schemes
- 📊 **Statistics** - Real-time tracking of accepted/rejected/pending decisions
- 🔧 **Bulk Actions** - Accept All and Reset All functionality
- 🔄 **Expandable Sections** - Collapsible sections with change count indicators

### `DiffField`
Individual field comparison component (used internally).

### `NestedDiff`
Handles nested object comparisons (used internally).

## Change Types

| Type | Color | Description | Actions |
|------|--------|-------------|---------|
| **Added** | 🟢 Green | New field in latest object | Accept/Reject |
| **Removed** | 🔴 Red | Field missing in latest object | Restore/Remove |
| **Changed** | 🟡 Yellow | Field value modified | Accept New/Keep Old |
| **Same** | ⚫ Gray | Unchanged field | Display only |
| **Nested** | 🔵 Blue | Contains nested changes | Expandable |

## API

### DiffViewer Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `oldObject` | Object | Previous version of the object | `{}` |
| `newObject` | Object | Latest version of the object | `{}` |
| `title` | String | Display title for the comparison | `'Object Comparison'` |
| `onMergedObjectChange` | Function | Callback when merged result changes | `undefined` |

### SourcesDiffViewer Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `sources` | Array | Array of source objects | `[]` |
| `title` | String | Display title | `'Sources Comparison'` |
| `onMergedSourceChange` | Function | Callback for merged source | `undefined` |

## Usage Examples

### Basic Comparison

```jsx
const oldData = {
  name: "Company A",
  products: ["Product 1", "Product 2"],
  revenue: 1000000
};

const newData = {
  name: "Company A Inc", // Changed
  products: ["Product 1", "Product 3"], // Modified array
  revenue: 1000000, // Same
  employees: 50 // Added
};

<DiffViewer 
  oldObject={oldData}
  newObject={newData}
  title="Company Data Changes"
  onMergedObjectChange={(result) => {
    console.log('Merged result:', result);
  }}
/>
```

### JBI Sources Comparison

```jsx
const apiResponse = {
  sources: [
    { /* source 1 */ },
    { /* source 2 */ },
    { /* source 3 - latest */ }
  ]
};

<SourcesDiffViewer 
  sources={apiResponse.sources}
  title="JBI Sources Review"
  onMergedSourceChange={(mergedSource) => {
    // Handle the final merged source
    updateSource(mergedSource);
  }}
/>
```

### Advanced Usage with State Management

```jsx
import { useState } from 'react';
import { DiffViewer } from './components/diff';

function MyComponent() {
  const [mergedResult, setMergedResult] = useState(null);
  const [isReviewing, setIsReviewing] = useState(true);

  const handleMergedChange = (merged) => {
    setMergedResult(merged);
  };

  const handleApprove = async () => {
    if (mergedResult) {
      await api.updateData(mergedResult);
      setIsReviewing(false);
    }
  };

  return (
    <div>
      {isReviewing ? (
        <DiffViewer
          oldObject={originalData}
          newObject={updatedData}
          onMergedObjectChange={handleMergedChange}
        />
      ) : (
        <div>Review completed!</div>
      )}
      
      {mergedResult && (
        <button onClick={handleApprove}>
          Approve Changes
        </button>
      )}
    </div>
  );
}
```

## Utility Functions

### `deepCompare(oldObj, newObj, path?)`
Performs deep comparison of two objects and returns a differences object.

### `applyChanges(baseObj, changes, acceptedChanges)`
Applies accepted changes to create a merged object.

### `getChangeTypeClass(type)`
Returns CSS classes for different change types.

### `formatValue(value)`
Formats values for display in the UI.

## Styling

The components use Tailwind CSS classes. Key color schemes:

- **Green**: Added fields, accept actions
- **Red**: Removed fields, reject actions  
- **Yellow**: Changed fields
- **Blue**: Nested objects, primary actions
- **Gray**: Unchanged fields, neutral actions

## File Structure

```
src/app/components/diff/
├── README.md              # This file
├── index.js              # Main exports
├── utils.js              # Utility functions
├── DiffViewer.js         # Main diff component
├── DiffField.js          # Individual field component
├── NestedDiff.js         # Nested object component
└── SourcesDiffViewer.js  # JBI sources component
```

## Examples

See the example pages:
- `/diff-example` - Basic diff engine demo
- `/diff-jbi` - JBI API sources comparison demo

## Browser Support

- Modern browsers with ES2015+ support
- React 18+
- Tailwind CSS 3+

## Contributing

When adding new features:
1. Update utility functions if needed
2. Add appropriate TypeScript types
3. Update this README
4. Add example usage
5. Test with various data structures

## License

This component is part of the JBI frontend project.
