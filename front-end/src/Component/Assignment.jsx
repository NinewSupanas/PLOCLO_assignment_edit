import React, { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import { Link } from "react-router-dom";
import * as XLSX from "xlsx"; 

function Assignment() {
  const [programs, setPrograms] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [course, setCourse] = useState("");
  const [CLOs, setCLOs] = useState([]);
  const [plos, setPlos] = useState([]);
  const [editingScores, setEditingScores] = useState(false);
  const [courses, setCourses] = useState([]);
  const [scores, setScores] = useState({});
  const [weights, setWeights] = useState({});
  const [excelData, setExcelData] = useState(null);
  const [allFiltersSelected, setAllFiltersSelected] = useState(false);
  const [year, setYear] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [facultys, setFacultys] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedUniversity, setSelectedUniversity] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [assignmentName, setAssignmentName] = useState("");
  const [programCourseData, setProgramCourseData] = useState({
    courses: [],
    sections: [],
    semesters: [],
    years: [],
  });
  const [assignments, setAssignments] = useState([]);
  const [typeError, setTypeError] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedAssignmentName, setSelectedAssignmentName] = useState("");
  const [homeworks, setHomeworks] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [cloWeights, setCloWeights] = useState({});
  const [mappings, setMappings] = useState([]); // For PLO-CLO mappings

  useEffect(() => {
    // Fetch universities
    fetch("http://localhost:8000/university")
      .then((response) => response.json())
      .then((data) => setUniversities(data))
      .catch((error) => console.error("Error fetching universities:", error));
  }, []);
 
  useEffect(() => {
    if (!selectedUniversity) return;

    fetch(`http://localhost:8000/faculty?university_id=${selectedUniversity}`)
      .then(async (response) => {
        if (!response.ok) {
          console.error(`HTTP Error: ${response.status}`);
          return response.text().then((text) => {
            throw new Error(text || `HTTP ${response.status}`);
          });
        }
        const text = await response.text();
        return text ? JSON.parse(text) : [];
      })
      .then((data) => {
        const formattedData = Array.isArray(data) ? data : [data];
        console.log("Formatted Facultys:", formattedData);
        setFacultys(formattedData);
      })
      .catch((error) => {
        console.error(" Error fetching facultys:", error);
        setFacultys([]);
      });
  }, [selectedUniversity]);
 
  useEffect(() => {
    if (selectedFaculty) {
      // Fetch programs by selected faculty
      fetch(`http://localhost:8000/program?faculty_id=${selectedFaculty}`)
        .then((response) => response.json())
        .then((data) => setPrograms(data))
        .catch((error) => console.error("Error fetching programs:", error));
    }
  }, [selectedFaculty]);
 
  useEffect(() => {
    if (selectedProgram) {
      // Convert selectedProgram to a string to ensure type consistency
      const programId = String(selectedProgram);

      console.log("Fetching courses for Program ID:", programId);

      fetch(`http://localhost:8000/program_courses_detail?program_id=${programId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Raw Courses Data for Program:", data);

          if (data && data.length > 0) {
            // Filter unique courses
            const uniqueCourses = data.reduce((acc, course) => {
              const existingCourse = acc.find(
                (c) => c.course_id === course.course_id
              );

              if (!existingCourse) {
                acc.push({
                  course_id: course.course_id,
                  course_name: course.course_name,
                  course_engname: course.course_engname,
                  program_name: course.program_name,
                });
              }

              return acc;
            }, []);

            // Extract unique sections
            const uniqueSections = [
              ...new Set(data.map((item) => item.section_id)),
            ];

            // Extract unique semesters
            const uniqueSemesters = [
              ...new Set(data.map((item) => item.semester_id)),
            ];

            // Extract unique years
            const uniqueYears = [...new Set(data.map((item) => item.year))];

            console.log("Unique Courses:", uniqueCourses);
            console.log("Unique Sections:", uniqueSections);
            console.log("Unique Semesters:", uniqueSemesters);
            console.log("Unique Years:", uniqueYears);

            setProgramCourseData((prevData) => ({
              ...prevData,
              courses: uniqueCourses,
              sections: uniqueSections,
              semesters: uniqueSemesters,
              years: uniqueYears,
            }));
          } else {
            console.warn("No courses found for this program");
            setProgramCourseData((prevData) => ({
              ...prevData,
              courses: [],
              sections: [],
              semesters: [],
              years: [],
            }));
          }
        })
        .catch((error) => {
          console.error("Error fetching program courses:", error);
          setProgramCourseData((prevData) => ({
            ...prevData,
            courses: [],
            sections: [],
            semesters: [],
            years: [],
          }));
        });
    }
  }, [selectedProgram]);

  // Fetch assignments for the selected course, section, semester, and year
// Fetch assignments for the selected course, section, semester, and year
useEffect(() => {
  if (
    selectedCourseId &&
    selectedSectionId &&
    selectedSemesterId &&
    selectedYear &&
    selectedProgram
  ) {
    setLoading(true);
    fetch(`http://localhost:8000/api/get_course_assignments?course_id=${selectedCourseId}&section_id=${selectedSectionId}&semester_id=${selectedSemesterId}&year=${selectedYear}&program_id=${selectedProgram}`)
      .then(response => {
        if (!response.ok) throw new Error("Failed to fetch assignments");
        return response.json();
      })
      .then(data => {
        console.log("Assignments data:", data);
        
        if (data.length > 0) {
          // Convert the database assignments to the format needed for the form
          const formattedHomeworks = data.map(assignment => ({
            id: assignment.assignment_id,
            name: assignment.assignment_name,
            scores: {} // Initialize empty scores for each homework
          }));
          setHomeworks(formattedHomeworks);
        } else {
          // If no assignments found, set to empty array
          setHomeworks([]);
        }
        
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching assignments:", error);
        setHomeworks([]);
        setLoading(false);
      });
  }
}, [
  selectedCourseId,
  selectedSectionId,
  selectedSemesterId,
  selectedYear,
  selectedProgram
]);

  // Fetch CLOs for selected course, section, semester, and year
  useEffect(() => {
    if (
      selectedCourseId &&
      selectedSectionId &&
      selectedSemesterId &&
      selectedYear &&
      selectedProgram
    ) {
      // Find the program data first
      const selectedProgramData = programs.find(
        (program) =>
          program.program_id.toString() === selectedProgram.toString()
      );

      if (!selectedProgramData) {
        console.error("Program not found:", selectedProgram);
        setCLOs([]);
        setMappings([]);
        setPlos([]);
        return;
      }

      const programId = selectedProgramData.program_id;
 
      // แก้ไขชื่อ API จาก course_clo เป็น assignment_clo
      fetch(`http://localhost:8000/assignment_clo?program_id=${programId}&course_id=${selectedCourseId}&semester_id=${selectedSemesterId}&section_id=${selectedSectionId}&year=${selectedYear}`)
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch CLOs");
          return response.json();
        })
        .then((cloData) => {
          console.log("CLO Data received:", cloData);
          const formattedCLOs = Array.isArray(cloData) ? cloData : [cloData];
          setCLOs(formattedCLOs);
          
          // Initialize CLO weights
          const initialWeights = {};
          formattedCLOs.forEach(clo => {
            // ฟิลด์ CLO_id แทน clo_id ในข้อมูลที่ได้จาก API
            const cloId = clo.CLO_id || clo.clo_id;
            initialWeights[cloId] = clo.weight || 10;
          });
          setCloWeights(initialWeights);
          
          // Reset homework scores for the new CLOs
          resetHomeworkScores(formattedCLOs);
        })
        .catch(error => {
          console.error("Error fetching CLOs:", error);
          setCLOs([]);
          setCloWeights({});
        });
    }
  }, [
    selectedCourseId,
    selectedSectionId,
    selectedSemesterId,
    selectedYear,
    selectedProgram,
    programs,
  ]);

  // Fetch PLO-CLO mappings
  useEffect(() => {
    if (
      selectedCourseId &&
      selectedSectionId &&
      selectedSemesterId &&
      selectedYear &&
      selectedProgram
    ) {
      // Find the program data first
      const selectedProgramData = programs.find(
        (program) =>
          program.program_id.toString() === selectedProgram.toString()
      );
  
      if (!selectedProgramData) {
        console.error("Program not found:", selectedProgram);
        setMappings([]);
        return;
      }
  
      const programId = selectedProgramData.program_id;
  
      // ดึงข้อมูลความสัมพันธ์ระหว่าง PLO และ CLO (ซึ่งมี weight)
      fetch(`http://localhost:8000/clo_mapping?course_id=${selectedCourseId}&section_id=${selectedSectionId}&semester_id=${selectedSemesterId}&year=${selectedYear}&program_id=${programId}`)
        .then(response => {
          if (!response.ok) throw new Error("Failed to fetch PLO-CLO mappings");
          return response.json();
        })
        .then(data => {
          console.log("PLO-CLO Mapping data:", data);
          const formattedMappings = Array.isArray(data) ? data : [data];
          setMappings(formattedMappings);
          
          // อัปเดต weight ของ CLO จากข้อมูล mappings
          // สร้าง object ใหม่เพื่อเก็บ weight ของแต่ละ CLO
          const updatedWeights = {};
          
          // วนลูปผ่านข้อมูล mapping แต่ละรายการ
          formattedMappings.forEach(mapping => {
            const cloId = mapping.CLO_id;
            const weight = mapping.weight || 10; // ใช้ค่าเริ่มต้น 10 ถ้าไม่มี weight
            
            // ถ้ายังไม่มี weight สำหรับ CLO นี้ หรือ weight ที่พบมีค่ามากกว่าเดิม
            // ให้ใช้ weight นี้แทน (เพื่อให้ได้ weight สูงสุดของแต่ละ CLO)
            if (!updatedWeights[cloId] || weight > updatedWeights[cloId]) {
              updatedWeights[cloId] = weight;
            }
          });
          
          // อัปเดต state cloWeights
          setCloWeights(updatedWeights);
          
          // ตรวจสอบการอัปเดต
          console.log("Updated CLO weights from mappings:", updatedWeights);
        })
        .catch(error => {
          console.error("Error fetching PLO-CLO mappings:", error);
          setMappings([]);
        });
    }
  }, [
    selectedCourseId,
    selectedSectionId,
    selectedSemesterId,
    selectedYear,
    selectedProgram,
    programs,
  ]);

  // Reset homework scores when CLOs change
  // Reset homework scores when CLOs change
const resetHomeworkScores = (clos) => {
  const updatedHomeworks = homeworks.map(hw => {
    const newScores = {};
    clos.forEach(clo => {
      // Support both CLO_id and clo_id
      const cloId = clo.CLO_id || clo.clo_id;
      newScores[cloId] = 0;
    });
    
    return {
      ...hw,
      scores: newScores
    };
  });
  
  setHomeworks(updatedHomeworks);
  setValidationErrors({});
};

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8000/api/get_assignments")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        console.log("Assignments data:", data);
        setAssignments(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching assignments:", error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>กำลังโหลดข้อมูล...</div>;
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>

  const handleSelectProgram = (programName) => {
    setSelectedProgram(programName);
    setSelectedCourseId("");
    setSelectedSectionId("");
    setSelectedSemesterId("");
    setSelectedYear("");
  };

  const validateCloScores = () => {
    const errors = {};
    
    // For each CLO
    CLOs.forEach(clo => {
      // รองรับทั้ง CLO_id และ clo_id
      const cloId = clo.CLO_id || clo.clo_id;
      // ใช้ weight จาก cloWeights ที่อัปเดตจาก mappings
      const maxWeight = cloWeights[cloId] || 10; // ใช้ค่าเริ่มต้น 10 ถ้าไม่มี weight
      
      // Calculate total across all homeworks for this CLO
      const total = homeworks.reduce((sum, hw) => {
        return sum + (hw.scores[cloId] || 0);
      }, 0);
      
      // If total exceeds max weight, mark as error
      if (total > maxWeight) {
        const cloCode = clo.CLO_code || `CLO${cloId}`;
        errors[cloId] = `Total scores (${total}) exceed the maximum weight (${maxWeight}) for ${cloCode}`;
      }
    });
    
    setValidationErrors(errors);
    return errors;
  };


  // ฟังก์ชันสำหรับบันทึก Assignment และไปยัง Step 2
// ฟังก์ชันสำหรับบันทึก Assignment และไปยัง Step 2
// ฟังก์ชันสำหรับบันทึก Assignment และไปยัง Step 2
const handleSaveStep1 = () => {
  if (
    !selectedProgram ||
    !selectedCourseId ||
    !selectedSectionId ||
    !selectedSemesterId ||
    !selectedYear ||
    !assignmentName
  ) {
    setTypeError("กรุณากรอกข้อมูลทั้งหมดก่อนบันทึก");
    return;
  }

  // สร้างข้อมูล assignment ใหม่ตามรูปแบบที่ backend ต้องการ
  const newAssignment = {
    program_id: selectedProgram,
    course_name: selectedCourseId,     
    section_id: selectedSectionId,
    semester_id: selectedSemesterId,
    year: selectedYear,
    assignment_name: assignmentName,   
    faculty_id: selectedFaculty,      
    university_id: selectedUniversity
  };

  console.log("Sending data:", newAssignment);

  // บันทึกข้อมูล assignment
  fetch("http://localhost:8000/api/add_assignment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(newAssignment),
  })
    .then((response) => {
      if (!response.ok) {
        console.error("Error status:", response.status);
        return response.json().then(data => {
          console.error("Error details:", data);
          throw new Error(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data && (data.success || data.message === 'Assignment บันทึกสำเร็จ')) {
        alert("บันทึก Assignment สำเร็จ!");
        
        // ไปยัง Step 2 หลังจากบันทึกสำเร็จ
        setCurrentStep(2);
        
        // สร้าง homework ใหม่จาก assignment ที่บันทึก
        if (data.assignment_id) {
          const newHomework = {
            id: data.assignment_id,
            name: assignmentName,
            scores: {}
          };
          
          // ถ้า CLOs มีข้อมูลแล้ว กำหนดคะแนนเริ่มต้นเป็น 0
          if (CLOs && CLOs.length > 0) {
            CLOs.forEach(clo => {
              const cloId = clo.CLO_id || clo.clo_id;
              newHomework.scores[cloId] = 0;
            });
          }
          
          setHomeworks([newHomework]);
        }
      } else {
        alert(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    })
    .catch((error) => {
      console.error("Error saving Assignment:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    });
};


// ฟังก์ชันสำหรับบันทึกคะแนน CLO ในส่วน Step 2
// ฟังก์ชันสำหรับบันทึกคะแนน CLO ในส่วน Step 2
// ส่วนที่ต้องแก้ไขในฟังก์ชัน handleSaveAssignment
// แก้ไขฟังก์ชัน prepareDataForApi

const handleSaveAssignment = () => {
  if (
    !selectedProgram ||
    !selectedCourseId ||
    !selectedSectionId ||
    !selectedSemesterId ||
    !selectedYear
  ) {
    setTypeError("กรุณากรอกข้อมูลทั้งหมดก่อนบันทึก");
    return;
  }
  
  // ตรวจสอบความถูกต้องของคะแนน CLO
  const validationErrors = validateCloScores();
  if (Object.keys(validationErrors).length > 0) {
    return;
  }

  // ตรวจสอบว่ามี homeworks หรือไม่
  if (!homeworks || homeworks.length === 0) {
    alert("ไม่พบข้อมูล Assignment ที่จะบันทึก");
    return;
  }

  // สร้างข้อมูล API ในรูปแบบที่ถูกต้อง
  const prepareDataForApi = () => {
    // สร้าง array ของข้อมูล CLO สำหรับทุก homework
    const apiData = [];
    
    homeworks.forEach(hw => {
      // วนลูปสำหรับแต่ละ CLO ใน homework
      for (const cloId in hw.scores) {
        if (Object.prototype.hasOwnProperty.call(hw.scores, cloId)) {
          const score = hw.scores[cloId];
          
          // ใช้ weight จาก cloWeights ที่อัปเดตจาก mappings
          const weight = cloWeights[cloId] || 10; // ใช้ค่าเริ่มต้น 10 ถ้าไม่มี weight
          
          // เพิ่มข้อมูลในรูปแบบที่ API ต้องการ
          apiData.push({
            assignment_id: hw.id,
            item: {
              clo_id: cloId
            },
            score: score,
            weight: weight
          });
        }
      }
    });
    
    return apiData;
  };

  // บันทึกข้อมูล
  const saveData = async () => {
    try {
      const dataToSend = prepareDataForApi();
      
      console.log('Data being sent to API:', {
        data: dataToSend
      });
      
      const response = await fetch("http://localhost:8000/api/save_assignment_clo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: dataToSend
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
      
      const result = await response.json();
      console.log("Save result:", result);
      
      // แสดงข้อความเมื่อบันทึกสำเร็จ
      alert("บันทึกคะแนน CLO สำเร็จ!");
      
      // ดึงข้อมูล assignments อีกครั้ง
      // refreshAssignmentData();
      
    } catch (error) {
      console.error("Error saving assignment CLO scores:", error);
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    }
  };
  
  // เริ่มการบันทึกข้อมูล
  saveData();
};

  

  const handleFetchStudents = () => {
    fetch("http://localhost:8000/students")
      .then((response) => response.json())
      .then((data) => {
        setStudents(data);
      })
      .catch((error) => console.error("Error fetching students:", error));
  };

  const handleAddStudentToAssignment = (studentId, assignmentId) => {
    const student = students.find((s) => s.student_id === studentId);
    const assignment = assignments.find((a) => a.assignment_id === assignmentId);
    
    if (student && assignment) {
      console.log("Adding student to assignment...");
      console.log("Student ID:", student.student_id);
      console.log("Student Name:", student.name);
      console.log("Course:", assignment.course_name);
      console.log("Assignment Name:", assignment.assignment_name);
      console.log("Year:", assignment.year);
    
      fetch("http://localhost:8000/api/add_student_to_assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: student.student_id,
          name: student.name,
          course: assignment.course_name,
          assignment_id: assignment.assignment_id,
          assignment_name: assignment.assignment_name,
          year: assignment.year
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then(data => {
              console.error("Server error details:", data);
              throw new Error(data.message || "Failed to add student");
            });
          }
          return response.json();
        })
        .then((data) => {
          if (data.message) {
            alert("Student added successfully!");
          }
        })
        .catch((error) => {
          console.error("Error adding student:", error);
          alert("Error: " + error.message);
        });
    } else {
      console.error("Student or assignment not found");
      alert("Student or assignment information is missing.");
    }
  };

  // Handle changing scores for a homework and CLO
  const handleScoreChange = (homeworkId, cloId, value) => {
    // Convert to number or default to 0 if empty
    const numValue = value === "" ? 0 : parseInt(value, 10);
    
    // Update the homework scores
    const updatedHomeworks = homeworks.map(hw => {
      if (hw.id === homeworkId) {
        return {
          ...hw,
          scores: {
            ...hw.scores,
            [cloId]: numValue
          }
        };
      }
      return hw;
    });
    
    setHomeworks(updatedHomeworks);
    
    // Validate scores after change
    setTimeout(() => validateCloScores(), 100);
  };

  // Calculate total scores for a specific CLO across all homeworks
  const calculateCloTotal = (cloId) => {
    return homeworks.reduce((total, hw) => {
      return total + (hw.scores[cloId] || 0);
    }, 0);
  };

  // Function to go to the next step
  const goToNextStep = () => {
    setCurrentStep(2);
  };

  // Function to go to the previous step
  const goToPreviousStep = () => {
    setCurrentStep(1);
  };

  // Function to get background color based on score value
  const getScoreColor = (score) => {
    if (score === 0) return "";
    if (score < 5) return "bg-danger text-white";
    if (score < 8) return "bg-warning";
    return "bg-success text-white";
  };

  return (
    <div className="container-fluid py-4" style={{ 
      backgroundColor: "#f9f9f9", 
      overflowY: "auto",  // แก้ปัญหาการเลื่อน
      height: "auto",     // ให้ความสูงปรับตามเนื้อหา
      minHeight: "100vh"  // ให้มีความสูงอย่างน้อยเท่ากับความสูงของหน้าจอ
    }}>
    <div className="container-fluid py-4 d-flex flex-column min-vh-100" style={{ backgroundColor: "#f9f9f9", overflowX: "hidden" }}>
      {/* Header */}
      <div className="d-flex align-items-center mb-4 sticky-top bg-white p-3 shadow-sm">
        <button className="btn btn-outline-dark me-3">
          <FaBars />
        </button>
        <h5 className="mb-0">Assignment Management</h5>
      </div>
  
      <div className="container mb-4">
        {/* Step indicator */}
        <div className="mb-4">
          <div className="progress" style={{ height: "25px" }}>
            <div 
              className="progress-bar" 
              role="progressbar" 
              style={{ width: currentStep === 1 ? '50%' : '100%', fontSize: "14px" }}
              aria-valuenow={currentStep === 1 ? 50 : 100} 
              aria-valuemin="0" 
              aria-valuemax="100"
            >
              {currentStep === 1 ? 'Step 1: Assignment Information' : 'Step 2: CLO Scoring System'}
            </div>
          </div>
        </div>
  
        {/* Step 1: Assignment Information */}
        {currentStep === 1 && (
          <div className="row">
            <div className="col-md-10 mx-auto">
              {/* University Selection */}
              <div className="card mb-3 shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h6 className="mb-0">Course Selection</h6>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <label className="form-label">Select University:</label>
                    <select
                      className="form-select"
                      value={selectedUniversity}
                      onChange={(e) => setSelectedUniversity(e.target.value)}
                    >
                      <option value="" disabled>Select University</option>
                      {universities.map((university) => (
                        <option key={university.university_id} value={university.university_id}>
                          {university.university_name_en}
                        </option>
                      ))}
                    </select>
                  </div>
  
                  <div className="mb-3">
                    <label className="form-label">Select Faculty:</label>
                    <select
                      className="form-select"
                      value={selectedFaculty}
                      onChange={(e) => setSelectedFaculty(e.target.value)}
                      disabled={!selectedUniversity}
                    >
                      <option value="" disabled>Select Faculty</option>
                      {facultys.map((faculty) => (
                        <option key={faculty.faculty_id} value={faculty.faculty_id}>
                          {faculty.faculty_name_en}
                        </option>
                      ))}
                    </select>
                  </div>
  
                  <div className="mb-3">
                    <label className="form-label">Select Program:</label>
                    <select
                      className="form-select"
                      value={selectedProgram}
                      onChange={(e) => {
                        const programValue = e.target.value;
                        setSelectedProgram(programValue);
                      }}
                      disabled={!selectedFaculty}
                    >
                      <option value="" disabled>Select Program</option>
                      {programs.map((program) => (
                        <option key={program.program_id} value={program.program_id.toString()}>
                          {program.program_name}
                        </option>
                      ))}
                    </select>
                  </div>
  
                  <div className="row mb-3">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Select Course:</label>
                      <select
                        className="form-select"
                        value={selectedCourseId || ""}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                        disabled={programCourseData.courses.length === 0}
                      >
                        <option value="" disabled>Select Course</option>
                        {programCourseData.courses.map((course) => (
                          <option key={course.course_id} value={course.course_id}>
                            {`${course.course_id} - ${course.course_name} (${course.course_engname})`}
                          </option>
                        ))}
                      </select>
                    </div>
  
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Select Section:</label>
                      <select
                        className="form-select"
                        value={selectedSectionId || ""}
                        onChange={(e) => setSelectedSectionId(e.target.value)}
                        disabled={programCourseData.sections.length === 0}
                      >
                        <option value="" disabled>Select Section</option>
                        {programCourseData.sections.map((section) => (
                          <option key={section} value={section}>{section}</option>
                        ))}
                      </select>
                    </div>
  
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Select Semester:</label>
                      <select
                        className="form-select"
                        value={selectedSemesterId || ""}
                        onChange={(e) => setSelectedSemesterId(e.target.value)}
                        disabled={!programCourseData.semesters.length}
                      >
                        <option value="" disabled>Select Semester</option>
                        {programCourseData.semesters.map((semester) => (
                          <option key={semester} value={semester}>{semester}</option>
                        ))}
                      </select>
                    </div>
  
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Select Year:</label>
                      <select
                        className="form-select"
                        value={selectedYear || ""}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        disabled={!programCourseData.years.length}
                      >
                        <option value="" disabled>Select Year</option>
                        {programCourseData.years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
  
                  <div className="mb-3">
                    <label htmlFor="assignment-name" className="form-label">Assignment Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="assignment-name"
                      value={assignmentName}
                      onChange={(e) => setAssignmentName(e.target.value)}
                      placeholder="Enter Assignment Name"
                    />
                  </div>
                </div>
              </div>
  
              {/* Error Message */}
              {typeError && <div className="alert alert-danger mt-3">{typeError}</div>}
  
              {/* Next Button */}
              <div className="d-flex justify-content-end mt-4">
                <button
                  className="btn btn-primary px-4"
                  onClick={() => {
                    handleSaveStep1();
                  }}
                  disabled={!(
                    selectedProgram &&
                    selectedCourseId &&
                    selectedSectionId &&
                    selectedSemesterId &&
                    selectedYear &&
                    assignmentName
                  )}
                >
                  Next <i className="fas fa-arrow-right ms-2"></i>
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Step 2: CLO Scoring System */}
        {currentStep === 2 && (
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0 text-center">ระบบกรอกคะแนนตามน้ำหนัก CLO</h5>
                </div>
                <div className="card-body p-4">
                  
                  {CLOs.length > 0 ? (
                    <>
                      <div className="table-responsive">
                        <table className="table table-bordered table-hover">
                          <thead className="table-light">
                            <tr>
                              <th className="text-center" style={{width: '50px'}}>No.</th>
                              <th className="text-center" style={{width: '200px'}}>HW</th>
                              {CLOs.map(clo => {
                                const cloId = clo.CLO_id || clo.clo_id;
                                return (
                                  <th key={cloId} className="text-center">
                                    {clo.CLO_code || `CLO${cloId}`}
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Weights row (yellow) */}
                            <tr className="table-warning">
                              <td className="font-weight-bold"></td>
                              <td className="font-weight-bold text-center">น้ำหนักคะแนน</td>
                              {CLOs.map(clo => {
                                const cloId = clo.CLO_id || clo.clo_id;
                                const weight = cloWeights[cloId] || 0;
                                return (
                                  <td key={cloId} className="text-center font-weight-bold">
                                    {weight}
                                  </td>
                                );
                              })}
                            </tr>
                            
                            {/* Homework rows */}
                            {homeworks.map((hw, index) => (
                              <tr key={hw.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>{hw.name}</td>
                                {CLOs.map(clo => {
                                  const cloId = clo.CLO_id || clo.clo_id;
                                  const currentScore = hw.scores[cloId] !== undefined ? hw.scores[cloId] : '';
                                  return (
                                    <td key={cloId} className={getScoreColor(currentScore || 0)}>
                                      <input
                                        type="number"
                                        min="0"
                                        max={cloWeights[cloId] || 10}
                                        value={currentScore}
                                        onChange={(e) => handleScoreChange(hw.id, cloId, e.target.value)}
                                        className={`form-control form-control-sm text-center ${getScoreColor(currentScore || 0)}`}
                                        style={{border: 'none'}}
                                      />
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            
                            {/* Totals row */}
                            <tr className="table-secondary font-weight-bold">
                              <td></td>
                              <td className="text-center">รวม</td>
                              {CLOs.map(clo => {
                                const cloId = clo.CLO_id || clo.clo_id;
                                const total = calculateCloTotal(cloId);
                                const maxWeight = cloWeights[cloId] || 0;
                                const isValid = total <= maxWeight;
                                
                                return (
                                  <td key={cloId} className={`text-center ${!isValid ? 'text-danger' : ''}`}>
                                    {total} / {maxWeight}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Add button */}
                      <div className="mt-3 mb-4">
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => {
                            const newHomework = {
                              id: -Math.floor(Math.random() * 1000),
                              name: `การบ้าน ${homeworks.length + 1}`,
                              scores: {}
                            };
                            const newScores = {};
                            CLOs.forEach(clo => {
                              const cloId = clo.CLO_id || clo.clo_id;
                              newScores[cloId] = 0;
                            });
                            newHomework.scores = newScores;
                            setHomeworks([...homeworks, newHomework]);
                          }}
                        >
                          <i className="fas fa-plus me-2"></i> เพิ่มการบ้าน
                        </button>
                      </div>
                      
                      {/* Validation errors */}
                      {Object.keys(validationErrors).length > 0 && (
                        <div className="alert alert-danger mt-3">
                          <strong>คะแนนที่กรอกเกินน้ำหนักที่กำหนด:</strong>
                          <ul className="mb-0 mt-2">
                            {Object.values(validationErrors).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="alert alert-info">
                      <i className="fas fa-info-circle me-2"></i>
                      ไม่พบข้อมูล CLO สำหรับรายวิชาที่เลือก กรุณาตรวจสอบข้อมูลการเลือกวิชา, ตอน, ภาคเรียน และปีการศึกษา
                    </div>
                  )}
                </div>
              </div>
              
              {/* Back and Save Buttons */}
              <div className="d-flex justify-content-between mt-4">
                <button className="btn btn-secondary px-4" onClick={goToPreviousStep}>
                  <i className="fas fa-arrow-left me-2"></i> Back
                </button>
                <button
                  className="btn btn-success px-4"
                  onClick={handleSaveAssignment}
                  disabled={Object.keys(validationErrors).length > 0 || CLOs.length === 0}
                >
                  <i className="fas fa-save me-2"></i> Save Assignment
                </button>
              </div>
            </div>
          </div>
        )}
  
        {/* Assignments List - Always visible */}
        <div className="row mt-5">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header bg-primary text-white py-3">
                <h5 className="mb-0 text-center">รายการงานที่มอบหมาย</h5>
              </div>
              <div className="card-body">
                {assignments.length === 0 ? (
                  <div className="text-center text-muted py-4">
                    <i className="fas fa-clipboard-list fa-3x mb-3"></i>
                    <p>ไม่พบข้อมูลงานที่มอบหมาย</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>ชื่องาน</th>
                          <th>กลุ่ม</th>
                          <th>เทอม</th>
                          <th>ปี</th>
                          <th>วันที่สร้าง</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment, index) => (
                          <tr key={assignment.assignment_id} 
                              style={{cursor: 'pointer'}}
                              onClick={() => setSelectedAssignment(assignment)}>
                            <td>{assignment.assignment_name}</td>
                            <td>{assignment.section_id}</td>
                            <td>{assignment.semester_id}</td>
                            <td>{assignment.year}</td>
                            <td>{new Date(assignment.created_at).toLocaleDateString('th-TH')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
  
        {/* Students List - Show only when an assignment is selected */}
        {selectedAssignment && students.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-info text-white">
                  <h5 className="mb-0">Students for Assignment: {selectedAssignment?.assignment_name}</h5>
                </div>
                <div className="card-body">
                  <ul className="list-group">
                    {students.map((student) => (
                      <li key={student.student_id} className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{student.studentid}</strong> - 
                          <strong>{student.name}</strong>
                          <br />
                          <small className="text-muted">{student.course_name}</small>
                        </div>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => {
                            if (!selectedAssignment) return;
                            handleAddStudentToAssignment(student.student_id, selectedAssignment.assignment_id);
                          }}
                        >
                          <i className="fas fa-plus me-1"></i>
                          Add Student
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-3 bg-light text-center">
        <div className="container">
          <span className="text-muted">Assignment Management System &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  </div>
  );
}

export default Assignment;