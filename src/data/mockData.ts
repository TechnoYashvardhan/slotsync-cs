export const DEFAULT_MOCK_CSV = `Date,Time,CourseSem,Subject,Teacher Name,Venue
21-09-2026,08:30 AM to 10:00 AM,BCA 1st Sem,Programming in C,Dr. Alan Turing,Classroom 301
21-09-2026,11:45 AM to 01:15 PM,BCA 3rd Sem,Data Structures & Algorithms,Prof. Ada Lovelace,Lab 2 (Data Structures)
21-09-2026,01:30 PM to 03:00 PM,MCA 1st Sem,Advanced Operating Systems,Dr. Barbara Liskov,Seminar Hall A
21-09-2026,03:15 PM to 04:45 PM,B.Tech CS 3rd Sem,Computer Organization,Prof. Donald Knuth,Classroom 302
21-09-2026,09:00 AM to 10:30 AM,B.Tech CS 5th Sem,Artificial Intelligence & ML,Prof. Ada Lovelace,Seminar Hall A
22-09-2026,08:00 AM to 09:30 AM,BCA 1st Sem,Programming in C,Dr. Alan Turing,Classroom 301
22-09-2026,11:45 AM to 01:15 PM,BCA 1st Sem,Computer Architecture & Hardware,Prof. Grace Hopper,Lab 1 (Programming)
22-09-2026,01:30 PM to 03:00 PM,BCA 1st Sem,Discrete Mathematics,Dr. John von Neumann,Classroom 301
22-09-2026,03:00 PM to 04:30 PM,BCA 1st Sem,Digital Logic Systems,Prof. Donald Knuth,Classroom 302
22-09-2026,08:30 AM to 10:00 AM,BCA 3rd Sem,Data Structures & Algorithms,Prof. Ada Lovelace,Classroom 303
22-09-2026,11:45 AM to 01:15 PM,BCA 3rd Sem,Object-Oriented Programming (Java),Dr. Claude Shannon,Lab 2 (Data Structures)
22-09-2026,01:30 PM to 03:00 PM,BCA 3rd Sem,Database Management Systems,Dr. Alan Turing,Classroom 303
22-09-2026,09:00 AM to 10:30 AM,MCA 1st Sem,Advanced Operating Systems,Dr. Barbara Liskov,Seminar Hall A
22-09-2026,11:45 AM to 01:15 PM,MCA 1st Sem,Distributed Systems & Cloud,Prof. Linus Torvalds,Lab 3 (Systems & OS)
22-09-2026,02:00 PM to 03:30 PM,MCA 1st Sem,Software Engineering & Agile,Prof. Grace Hopper,Classroom 304
22-09-2026,08:00 AM to 09:30 AM,MCA 3rd Sem,Advanced Network Security,Prof. Ken Thompson,Classroom 305
22-09-2026,11:45 AM to 01:15 PM,MCA 3rd Sem,Full-Stack Web Engineering,Dr. Tim Berners-Lee,Lab 1 (Programming)
22-09-2026,01:30 PM to 03:00 PM,MCA 3rd Sem,Data Warehousing & Mining,Dr. Barbara Liskov,Classroom 305
22-09-2026,08:00 AM to 10:00 AM,B.Tech CS 3rd Sem,Design & Analysis of Algorithms,Dr. Edsger Dijkstra,Lab 4 (Networks)
22-09-2026,11:45 AM to 01:15 PM,B.Tech CS 3rd Sem,Computer Organization,Prof. Donald Knuth,Classroom 302
22-09-2026,02:00 PM to 04:00 PM,B.Tech CS 3rd Sem,Object-Oriented Design,Dr. Claude Shannon,Lab 2 (Data Structures)
22-09-2026,08:30 AM to 10:00 AM,B.Tech CS 5th Sem,Theory of Computation & Automata,Dr. John von Neumann,Classroom 304
22-09-2026,11:45 AM to 01:15 PM,B.Tech CS 5th Sem,Artificial Intelligence & ML,Prof. Ada Lovelace,Seminar Hall A
22-09-2026,02:30 PM to 04:00 PM,B.Tech CS 5th Sem,Compiler Design & Optimization,Prof. Linus Torvalds,Lab 3 (Systems & OS)
23-09-2026,08:30 AM to 10:30 AM,BCA 1st Sem,C Programming Lab,Dr. Alan Turing,Lab 1 (Programming)
23-09-2026,11:45 AM to 01:15 PM,BCA 1st Sem,Mathematics for Computing,Prof. Grace Hopper,Classroom 301
23-09-2026,02:00 PM to 03:30 PM,MCA 1st Sem,Relational DBMS Workshop,Dr. Barbara Liskov,Seminar Hall A
23-09-2026,11:45 AM to 01:15 PM,BCA 3rd Sem,Object-Oriented Programming (Java),Dr. Claude Shannon,Lab 2 (Data Structures)
23-09-2026,01:00 PM to 02:30 PM,B.Tech CS 3rd Sem,Design & Analysis of Algorithms,Dr. Edsger Dijkstra,Classroom 302
24-09-2026,08:30 AM to 10:00 AM,BCA 1st Sem,Digital Logic Systems,Prof. Donald Knuth,Classroom 301
24-09-2026,11:45 AM to 01:15 PM,BCA 3rd Sem,Database Management Systems,Dr. Alan Turing,Lab 2 (Data Structures)
24-09-2026,01:00 PM to 02:30 PM,MCA 1st Sem,Distributed Systems & Cloud,Prof. Linus Torvalds,Lab 3 (Systems & OS)
24-09-2026,02:30 PM to 04:00 PM,B.Tech CS 5th Sem,Artificial Intelligence & ML,Prof. Ada Lovelace,Seminar Hall A
25-09-2026,09:00 AM to 10:30 AM,BCA 1st Sem,Computer Architecture & Hardware,Prof. Grace Hopper,Classroom 301
25-09-2026,11:45 AM to 01:15 PM,MCA 3rd Sem,Full-Stack Web Engineering,Dr. Tim Berners-Lee,Lab 1 (Programming)
25-09-2026,01:30 PM to 03:30 PM,B.Tech CS 3rd Sem,Networks Lab & Protocols,Dr. Edsger Dijkstra,Lab 4 (Networks)
25-09-2026,02:00 PM to 03:30 PM,BCA 3rd Sem,Discrete Structures,Dr. John von Neumann,Classroom 303`;

export const KNOWN_SUBJECTS = [
  'Data Structures & Algorithms',
  'Design & Analysis of Algorithms',
  'Advanced Operating Systems',
  'Distributed Systems & Cloud',
  'Database Management Systems',
  'Computer Networks & Security',
  'Artificial Intelligence & ML',
  'Software Engineering & Agile',
  'Compiler Design & Optimization',
  'Theory of Computation & Automata',
  'Programming in C / Java / Python',
  'Full-Stack Web Engineering',
];

export const KNOWN_TEACHERS = [
  'Dr. Alan Turing',
  'Prof. Grace Hopper',
  'Dr. John von Neumann',
  'Prof. Ada Lovelace',
  'Dr. Claude Shannon',
  'Dr. Barbara Liskov',
  'Prof. Linus Torvalds',
  'Prof. Ken Thompson',
  'Dr. Tim Berners-Lee',
  'Dr. Edsger Dijkstra',
  'Prof. Donald Knuth',
];

export const KNOWN_VENUES = [
  'Lab 1 (Programming)',
  'Lab 2 (Data Structures)',
  'Lab 3 (Systems & OS)',
  'Lab 4 (Networks)',
  'Classroom 301',
  'Classroom 302',
  'Classroom 303',
  'Classroom 304',
  'Classroom 305',
  'Seminar Hall A',
  'CS Auditorium',
];

export const KNOWN_BATCHES = [
  'BCA 1st Sem',
  'BCA 3rd Sem',
  'MCA 1st Sem',
  'MCA 3rd Sem',
  'B.Tech CS 3rd Sem',
  'B.Tech CS 5th Sem',
];
