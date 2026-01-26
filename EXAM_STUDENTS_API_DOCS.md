# Get Students for Exam API

## Endpoint
**GET** `/app/exam/:exam_id/students`

## Description
Retrieves a list of all students who are targeted by a specific exam. The endpoint intelligently resolves students based on the exam's target type:

- **STUDENT**: Returns directly targeted students
- **SECTION**: Returns all active students in the targeted section(s)
- **CLASS**: Returns all active students in all sections of the targeted class(es)
- **SCHOOL**: Returns all active students in the school (via campus)

## URL Parameters
- `exam_id` (required) - The UUID of the exam

## Request Example
```bash
curl http://localhost:5001/app/exam/exam-uuid-here/students
```

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "student_id": "student-uuid-1",
      "student_name": "John Michael Doe",
      "student_roll_no": "1",
      "student_photo_url": "https://storage.example.com/photos/student1.jpg",
      "student_admission_no": "2024001"
    },
    {
      "student_id": "student-uuid-2",
      "student_name": "Jane Smith",
      "student_roll_no": "2",
      "student_photo_url": "https://storage.example.com/photos/student2.jpg",
      "student_admission_no": "2024002"
    }
  ],
  "count": 2
}
```

### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `student_id` | string | Unique identifier for the student |
| `student_name` | string | Full name (first + middle + last name) |
| `student_roll_no` | string | Student's roll number |
| `student_photo_url` | string | URL to student's profile photo |
| `student_admission_no` | string | Student's admission number |

### Error Responses

#### Exam Not Found (404)
```json
{
  "success": false,
  "message": "Exam not found"
}
```

#### Server Error (500)
```json
{
  "success": false,
  "message": "Unable to fetch students for exam"
}
```

## How It Works

### 1. STUDENT Target Type
When the exam targets individual students:
```
Exam → ExamTarget(STUDENT) → Student IDs
```

### 2. SECTION Target Type
When the exam targets entire sections:
```
Exam → ExamTarget(SECTION) → Section → Students in Section
```

### 3. CLASS Target Type
When the exam targets entire classes:
```
Exam → ExamTarget(CLASS) → Class → All Sections → Students in Sections
```

### 4. SCHOOL Target Type
When the exam targets entire school:
```
Exam → ExamTarget(SCHOOL) → Campus → All Students in Campus
```

## Use Cases

### Use Case 1: Display Student List for Grading
A teacher opens the grading interface for an exam and needs to see all students who need to be graded.

```bash
GET /app/exam/exam-123/students

# Returns all students targeted by the exam
# Teacher can then grade each student
```

### Use Case 2: Check Exam Enrollment
An admin wants to verify which students are enrolled for a particular exam.

```bash
GET /app/exam/midterm-2026/students

# Returns complete list with student photos and roll numbers
# Useful for attendance during the exam
```

### Use Case 3: Generate Exam Attendance Sheet
Before the exam starts, generate an attendance sheet with all students who should appear.

```bash
GET /app/exam/final-2026/students

# Export the list to PDF/Excel
# Include photos for identification
```

### Use Case 4: Bulk Grade Initialization
When creating grades for all students in an exam subject:

```javascript
// Step 1: Get all students for the exam
const response = await fetch('/app/exam/exam-123/students');
const { data: students } = await response.json();

// Step 2: Create grade records for all students
const grades = students.map(student => ({
  exam_id: "exam-123",
  exam_subject_id: "subject-456",
  student_id: student.student_id,
  grades_obtained: null, // To be filled later
  graded_by: "teacher-789"
}));

// Step 3: Bulk create grades
await fetch('/app/exam-grade/bulk', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ grades })
});
```

## Important Notes

1. **Active Students Only**: Only students with `student_current_status = "active"` are returned

2. **Duplicate Handling**: If an exam targets multiple overlapping groups (e.g., both a section and individual students from that section), each student appears only once in the result

3. **Sorting**: Results are sorted by `student_roll_no` in ascending order

4. **Name Formatting**: The `student_name` field combines first, middle, and last names with spaces, omitting null/empty values

5. **Photo URLs**: The `student_photo_url` may be null if no photo has been uploaded

## Integration Examples

### JavaScript/React Example
```javascript
const ExamStudentsList = ({ examId }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/app/exam/${examId}/students`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStudents(data.data);
        }
      })
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return <div>Loading students...</div>;

  return (
    <div>
      <h3>Exam Students ({students.length})</h3>
      <ul>
        {students.map(student => (
          <li key={student.student_id}>
            <img src={student.student_photo_url} alt={student.student_name} />
            <span>{student.student_roll_no} - {student.student_name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### Python Example
```python
import requests

def get_exam_students(exam_id):
    response = requests.get(f'http://localhost:5001/app/exam/{exam_id}/students')
    
    if response.status_code == 200:
        data = response.json()
        if data['success']:
            return data['data']
    
    return []

# Usage
students = get_exam_students('exam-uuid-here')
for student in students:
    print(f"{student['student_roll_no']}: {student['student_name']}")
```

## Performance Considerations

- **Caching**: Consider caching results if the student list doesn't change frequently
- **Large Classes**: For exams with 500+ students, consider adding pagination
- **Database Indexes**: The function uses indexed fields (`student_section_id`, `campus_id`, `student_current_status`) for optimal performance

## Related Endpoints

- `POST /app/exam-grade` - Create/update grades for students
- `POST /app/exam-grade/bulk` - Bulk create/update grades for multiple students
- `GET /app/exam/:exam_id` - Get exam details including subjects
- `GET /app/exam-grade/exam/:exam_id` - Get all grades for an exam

---

**Created**: January 26, 2026  
**API Version**: 1.0.0
