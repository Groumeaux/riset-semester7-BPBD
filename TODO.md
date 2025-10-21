# TODO List for Disaster Reporting App with MySQL Integration

## Database Setup
- [x] Create `db_setup.sql` with schema for `users` and `disasters` tables, including sample data

## PHP Configuration
- [x] Create `config.php` for MySQL database connection using PDO

## API Endpoints
- [x] Create `login.php` to handle user authentication and session management
- [x] Create `save_disaster.php` to save new disaster reports as 'pending'
- [x] Create `get_disasters.php` to fetch disasters based on user role
- [x] Create `validation_process.php` to update disaster status (approve/reject) for head role

## Update Existing Files
- [x] Update `index.php` to include session checks, role-based UI, AJAX submissions, and logout
- [x] Modify `script.js` to use AJAX for data fetching/saving instead of dummy data

## New Pages
- [x] Create `validation.php` page for head to review and validate pending reports

## Testing and Followup
- [x] Run `db_setup.sql` in MySQL to set up database and tables
- [x] Ensure XAMPP MySQL is running
- [x] Test full workflow: login as user, add disaster, login as head, validate, print reports

## Monthly Batch Validation Implementation
- [x] Updated `validation.php` to show monthly batch validation interface
- [x] Modified `validate.js` to handle batch selection and dynamic button text
- [x] Updated `validation_process.php` to validate only current month reports
- [x] Added statistics cards and select-all functionality
