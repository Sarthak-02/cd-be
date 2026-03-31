1. validation of session before the attendance is taken (during selection of filter)
2. Once the validation is done , create a session with Draft status
3. separate taskq for finalizeAttendanceAndNotify (server timeout error)
4. How do we get the confirmation of notification pushed from pub/sub ?





----sarthak--------
1. need to add section_id to student table
2. work on resolving target to students (specifically to resolving class to student ids)