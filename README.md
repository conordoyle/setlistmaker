# Setlist Manager

A React application for managing setlists with drag and drop functionality, PDF export, and responsive design.

## Features

- 📝 Edit show name and date
- 🎵 Add, remove, and reorder songs
- 🖱️ Drag and drop song reordering
- 📄 Export setlist to PDF
- 📱 Responsive design for mobile and desktop
- 🌙 Dark mode support

## Testing

### Prerequisites

Make sure you have Node.js installed (version 16 or higher).

### Installation

1. Install dependencies:
```bash
npm install
```

### Running Tests

#### Run all tests once:
```bash
npm test
```

#### Run tests in watch mode (recommended for development):
```bash
npm run test:watch
```

#### Run tests with coverage report:
```bash
npm run test:coverage
```

### Test Coverage

The test suite covers:
- ✅ Component rendering
- ✅ User interactions (typing, clicking)
- ✅ State management
- ✅ Song CRUD operations
- ✅ PDF export functionality
- ✅ Drag and drop library loading
- ✅ Responsive layout
- ✅ Edge cases (empty lists, etc.)

### Test Files

- `setlistapp.test.jsx` - Main test suite for the SetlistApp component
- `jest.config.js` - Jest configuration
- `src/setupTests.js` - Test setup and global mocks

### Manual Testing

You can also test the application manually:

1. **Start the development server:**
```bash
npm start
```

2. **Open your browser** and navigate to `http://localhost:3000`

3. **Test the following features:**
   - Edit show name and date
   - Add new songs
   - Delete existing songs
   - Drag and drop songs to reorder
   - Export to PDF
   - Test responsive design on different screen sizes

### Testing Checklist

- [ ] App loads without errors
- [ ] Show name and date are editable
- [ ] Songs can be added and removed
- [ ] Song titles can be edited
- [ ] Drag and drop reordering works
- [ ] PDF export generates file
- [ ] Responsive design works on mobile
- [ ] Dark mode toggle works (if implemented)

## Development

### Project Structure

```
setlistmanager/
├── setlistapp.jsx          # Main React component
├── setlistapp.test.jsx     # Test suite
├── package.json            # Dependencies and scripts
├── jest.config.js          # Jest configuration
├── src/
│   └── setupTests.js       # Test setup
└── README.md               # This file
```

### Adding New Tests

When adding new features, make sure to:

1. Write tests first (TDD approach)
2. Test both happy path and edge cases
3. Mock external dependencies
4. Test accessibility features
5. Update this README if needed

### Common Test Patterns

```javascript
// Testing user interactions
const user = userEvent.setup();
await user.click(button);
await user.type(input, 'text');

// Testing state changes
expect(screen.getByDisplayValue('new value')).toBeInTheDocument();

// Testing async operations
await waitFor(() => {
  expect(element).toBeInTheDocument();
});
```

## Troubleshooting

### Test Issues

- **"Cannot find module" errors**: Make sure all dependencies are installed
- **"window is not defined"**: Check that `testEnvironment: 'jsdom'` is set in Jest config
- **External library errors**: Ensure proper mocking in test files

### Build Issues

- **CSS import errors**: Check that CSS files are properly configured
- **Babel transform errors**: Verify Babel configuration for JSX

## Contributing

1. Write tests for new features
2. Ensure all tests pass
3. Maintain test coverage above 80%
4. Follow the existing test patterns

## License

This project is open source and available under the MIT License.
