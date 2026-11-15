/* ==========================================================
   ისტორიის სამყარო — კურსებისა და გაკვეთილების სტრუქტურა
   ----------------------------------------------------------
   თითოეულ გაკვეთილს აქვს უნიკალური id (მაგ.: "g7-l1").
   სწორედ ეს id ინახება profile.completedLessons-ში და
   გადაეცემა lesson.html?course=...&lesson=... მისამართს.
   ========================================================== */

(function () {
  "use strict";

  const COURSES = [
    {
      id: "grade-7",
      badge: "7",
      title: "მე-7 კლასი",
      subtitle: "შესავალი ისტორიაში",
      color: "green",
      lessons: [
        {
          id: "g7-l1",
          title: "რა არის ისტორია და ისტორიული წყაროები",
          description: "გაიგე, რას სწავლობს ისტორია და საიდან ვიგებთ წარსულის შესახებ.",
          xp: 10,
        },
        {
          id: "g7-l2",
          title: "ქრონოლოგია და დროის ათვლა",
          description: "ჩვ. წ.-მდე და ჩვ. წ., საუკუნეები და ათასწლეულები.",
          xp: 10,
        },
      ],
    },
    {
      id: "grade-8",
      badge: "8",
      title: "მე-8 კლასი",
      subtitle: "შუა საუკუნეები",
      color: "blue",
      lessons: [
        {
          id: "g8-l1",
          title: "ბიზანტიის იმპერია და შუა საუკუნეების დასაწყისი",
          description: "როგორ შეიცვალა სამყარო რომის იმპერიის დაცემის შემდეგ.",
          xp: 10,
        },
      ],
    },
    {
      id: "grade-9",
      badge: "9",
      title: "მე-9 კლასი",
      subtitle: "ახალი დრო",
      color: "purple",
      lessons: [
        {
          id: "g9-l1",
          title: "დიდი გეოგრაფიული აღმოჩენები",
          description: "ზღვაოსნები, ახალი მარშრუტები და ახალი სამყარო.",
          xp: 10,
        },
      ],
    },
    {
      id: "grade-10",
      badge: "10",
      title: "მე-10 კლასი",
      subtitle: "რევოლუციების ეპოქა",
      color: "orange",
      lessons: [
        {
          id: "g10-l1",
          title: "საფრანგეთის დიდი რევოლუცია",
          description: "თავისუფლება, თანასწორობა, ძმობა — რევოლუციის მიზეზები და შედეგები.",
          xp: 10,
        },
      ],
    },
    {
      id: "grade-11",
      badge: "11",
      title: "მე-11 კლასი",
      subtitle: "XX საუკუნე",
      color: "red",
      lessons: [
        {
          id: "g11-l1",
          title: "პირველი მსოფლიო ომი",
          description: "ომის მიზეზები, ფრონტები და მსოფლიო რუკის ცვლილება.",
          xp: 10,
        },
      ],
    },
    {
      id: "grade-12",
      badge: "12",
      title: "მე-12 კლასი",
      subtitle: "თანამედროვე სამყარო",
      color: "teal",
      lessons: [
        {
          id: "g12-l1",
          title: "ცივი ომი და ორპოლუსიანი სამყარო",
          description: "აშშ და სსრკ — დაპირისპირება, რომელმაც XX საუკუნე განსაზღვრა.",
          xp: 10,
        },
      ],
    },
    {
      id: "national-exams",
      badge: "🎓",
      title: "აბიტურიენტები",
      subtitle: "ეროვნული გამოცდები",
      color: "gold",
      lessons: [
        {
          id: "ne-l1",
          title: "ისტორიული წყაროს ანალიზი",
          description: "როგორ წავიკითხოთ და შევაფასოთ წყარო გამოცდის დავალებაში.",
          xp: 15,
        },
      ],
    },
  ];

  function getCourse(courseId) {
    return COURSES.find((c) => c.id === courseId) || null;
  }

  function getLesson(courseId, lessonId) {
    const course = getCourse(courseId);
    if (!course) return null;
    return course.lessons.find((l) => l.id === lessonId) || null;
  }

  // გლობალური, მხოლოდ წასაკითხი წვდომა სხვა სკრიპტებისთვის
  window.IMS_DATA = Object.freeze({
    courses: COURSES,
    getCourse: getCourse,
    getLesson: getLesson,
  });
})();
