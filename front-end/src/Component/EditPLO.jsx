
import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import axios from "axios";

const CoursePloManagement = () => {
  const [programs, setPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [plos, setPlos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [scores, setScores] = useState({});
  const [weights, setWeights] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newPlo, setNewPlo] = useState({
    PLO_code: "",
    PLO_name: "",
    PLO_engname: "",
  });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedPlo, setSelectedPlo] = useState(null);
  const [editingScores, setEditingScores] = useState(false);
  const [excelData, setExcelData] = useState(null);
  const [typeError, setTypeError] = useState(null);

  // New states for filtering
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState("all");
  const [facultys, setFacultys] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState("all");
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");

  const [allFiltersSelected, setAllFiltersSelected] = useState(false);
  const [showLoadPreviousPLOModal, setShowLoadPreviousPLOModal] =
    useState(false);
  const [previousYearPLOs, setPreviousYearPLOs] = useState([]);

  // Fetch universities, facultys, and years
  useEffect(() => {
    axios
      .get("http://localhost:8000/university")
      .then((response) => setUniversities(response.data))
      .catch((error) => {
        console.error("Error fetching universities:", error);
        showAlert("ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้", "danger");
      });
  }, []);

  useEffect(() => {
    if (!selectedUniversity || selectedUniversity === "all") {
      setFacultys([]);
      setSelectedFaculty("all");
      return;
    }

    axios
      .get(`http://localhost:8000/faculty?university_id=${selectedUniversity}`)
      .then((response) => {
        const facultyData = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setFacultys(facultyData);

        if (
          facultyData.length > 0 &&
          !facultyData.some((f) => f.faculty_id.toString() === selectedFaculty)
        ) {
          setSelectedFaculty("all");
        }
      })
      .catch((error) => {
        console.error("Error fetching facultys:", error);
        showAlert("ไม่สามารถโหลดสาขาวิชาได้", "danger");
        setFacultys([]);
        setSelectedFaculty("all");
      });
  }, [selectedUniversity]);

  // Fetch programs
  useEffect(() => {
    if (!selectedFaculty || selectedFaculty === "all") {
      setFilteredPrograms([]);
      setYears([]);
      setSelectedYear("all");
      return;
    }

    axios
      .get(`http://localhost:8000/program?faculty_id=${selectedFaculty}`)
      .then((response) => {
        const programData = Array.isArray(response.data)
          ? response.data
          : [response.data];

        // Remove year filtering here - show all programs for the faculty
        setFilteredPrograms(programData);

        // Extract unique years but don't filter by them yet
        const uniqueYears = [
          ...new Set(
            programData.map((p) => p.year).filter((year) => year != null)
          ),
        ];

        setYears(uniqueYears.sort((a, b) => a - b));
      })
      .catch((error) => {
        console.error("Error fetching programs:", error);
        alert("ไม่สามารถโหลดหลักสูตรได้");
        setFilteredPrograms([]);
        setYears([]);
        setSelectedYear("all");
      });
  }, [selectedFaculty]); // เพิ่ม selectedYear เป็น dependency

  useEffect(() => {
    if (selectedYear !== "all" && selectedProgram) {
      const program = filteredPrograms.find(
        (p) => p.program_id.toString() === selectedProgram
      );
      if (program && program.year.toString() !== selectedYear) {
        // If selected program doesn't match selected year, reset program selection
        setSelectedProgram(null);
      }
    }
  }, [selectedYear, selectedProgram, filteredPrograms]);

  useEffect(() => {
    // ตรวจสอบว่าได้เลือกข้อมูลที่จำเป็นครบหรือไม่
    if (
      selectedUniversity &&
      selectedUniversity !== "all" &&
      selectedFaculty &&
      selectedFaculty !== "all" &&
      selectedYear &&
      selectedYear !== "all" &&
      selectedProgram
    ) {
      setAllFiltersSelected(true);
    } else {
      setAllFiltersSelected(false);
      // Reset PLO and course data if filters are incomplete
      if (!allFiltersSelected) {
        setPlos([]);
        setCourses([]);
        setWeights({});
      }
    }
  }, [selectedUniversity, selectedFaculty, selectedYear, selectedProgram]);

  useEffect(() => {
    if (allFiltersSelected && selectedProgram) {
      // 1. ดึงข้อมูล PLO
      fetch(`http://localhost:8000/program_plo?program_id=${selectedProgram}`)
        .then((response) => response.json())
        .then((data) => {
          setPlos(data.success ? data.message : []);
          console.log("PLOs loaded:", data.success ? data.message : []);
        })
        .catch(error => console.error("Error fetching PLOs:", error));
  
      // 2. ดึงข้อมูลรายวิชาทั้งหมดของโปรแกรม
      fetch(`http://localhost:8000/course?program_id=${selectedProgram}`)
        .then((response) => response.json())
        .then((coursesData) => {
          console.log("Raw courses data:", coursesData);
          
          // ตรวจสอบรูปแบบข้อมูลและแปลงให้อยู่ในรูปแบบที่ถูกต้อง
          let formattedCourses = [];
          if (coursesData.success && Array.isArray(coursesData.message)) {
            formattedCourses = coursesData.message;
          } else if (Array.isArray(coursesData)) {
            formattedCourses = coursesData;
          } else if (coursesData && typeof coursesData === 'object') {
            formattedCourses = [coursesData];
          }
          
          console.log("Formatted courses:", formattedCourses);
          
          // เก็บข้อมูลรายวิชา
          setCourses(formattedCourses);
          
          // 3. ดึงข้อมูล course-plo mapping
          fetch(`http://localhost:8000/course_plo?program_id=${selectedProgram}`)
            .then((response) => response.json())
            .then((mappingData) => {
              console.log("Mapping data:", mappingData);
              
              // แปลงข้อมูลการแมปให้อยู่ในรูปแบบ weights object
              const weightsData = {};
              let mappingArray = [];
              
              if (mappingData.success && Array.isArray(mappingData.message)) {
                mappingArray = mappingData.message;
              } else if (Array.isArray(mappingData)) {
                mappingArray = mappingData;
              } else if (mappingData && typeof mappingData === 'object') {
                mappingArray = [mappingData];
              }
              
              // สร้าง weights object
              mappingArray.forEach((item) => {
                const key = `${item.course_id}-${item.plo_id}`;
                weightsData[key] = item.weight;
              });
              
              setWeights(weightsData);
            })
            .catch((error) => {
              console.error("Error fetching mappings:", error);
              setWeights({});
            });
        })
        .catch((error) => {
          console.error("Error fetching courses:", error);
          setCourses([]);
        });
    }
  }, [allFiltersSelected, selectedProgram]);

  // Handler for university selection change
  const handleUniversityChange = (e) => {
    setSelectedUniversity(e.target.value);
    setSelectedProgram(null); // รีเซ็ตโปรแกรมที่เลือก
    setPlos([]); // ล้างข้อมูล PLO
    setCourses([]); // ล้างข้อมูลหลักสูตร
    setWeights({}); // ล้างข้อมูลน้ำหนัก
  };

  const handleFacultyChange = (e) => {
    setSelectedFaculty(e.target.value);
    setSelectedProgram(null);
    setPlos([]);
    setCourses([]);
    setWeights({});
  };

  // Handler for year selection change
  const handleYearChange = (e) => {
    const yearValue = e.target.value;
    setSelectedYear(yearValue);

    // If a year is selected, filter programs by that year
    if (yearValue !== "all" && selectedFaculty && selectedFaculty !== "all") {
      const yearFilteredPrograms = filteredPrograms.filter(
        (p) => p.year && p.year.toString() === yearValue
      );

      // If current selected program doesn't match the year filter, reset it
      if (selectedProgram) {
        const program = filteredPrograms.find(
          (p) => p.program_id.toString() === selectedProgram
        );
        if (program && program.year.toString() !== yearValue) {
          setSelectedProgram(null);
        }
      }
    }

    // Clear PLOs and courses when changing year
    setPlos([]);
    setCourses([]);
    setWeights({});
  };

  const getVisiblePrograms = () => {
    if (selectedYear !== "all") {
      return filteredPrograms.filter(
        (p) => p.year && p.year.toString() === selectedYear
      );
    }
    return filteredPrograms;
  };

  // Handle deleting a PLO
  const handleDeletePlo = (ploId) => {
    if (window.confirm("Are you sure you want to delete this PLO?")) {
      fetch(
        `http://localhost:8000/program_plo?program_id=${selectedProgram}&plo_id=${ploId}`,
        {
          method: "DELETE",
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            setPlos(plos.filter((plo) => plo.plo_id !== ploId));
            alert("PLO deleted successfully");
          } else {
            alert("Error deleting PLO: " + data.message);
          }
        })
        .catch((error) => {
          console.error("Error deleting PLO:", error);
          alert("An error occurred while deleting the PLO");
        });
    }
  };

  const handleInputChange = (courseId, ploId, value) => {
    if (editingScores) {
      const updatedScores = { ...scores };
      updatedScores[`${courseId}-${ploId}`] = value ? parseInt(value) : 0;
      setScores(updatedScores);
    }
  };

  const calculateTotal = (courseId) => {
    // กรณีที่ไม่มีข้อมูล PLO ให้คืนค่า 0
    if (!plos || plos.length === 0) return 0;
  
    return plos.reduce((sum, plo) => {
      const key = `${courseId}-${plo.plo_id}`;
      if (editingScores) {
        return sum + (scores[key] || 0); // ใช้ scores ถ้าอยู่ในโหมดแก้ไข
      } else {
        return sum + (weights[key] || 0); // ใช้ weights ถ้าไม่ได้อยู่ในโหมดแก้ไข
      }
    }, 0);
  };

  const handleEditToggle = () => {
    setEditingScores(!editingScores);
  };

  const handlePostScores = () => {
    // ตรวจสอบว่ามี program_id ที่เลือกและ scores ที่ต้องการส่ง
    if (!selectedProgram) {
      alert("Please select a program before submitting scores.");
      return;
    }
  
    if (Object.keys(scores).length === 0) {
      alert("No scores to submit. Please input scores first.");
      return;
    }
  
    // แปลง scores object ให้เป็น array ตามรูปแบบที่ต้องการ
    const scoresArray = Object.keys(scores).map((key) => {
      const [course_id, plo_id] = key.split("-");
      return {
        course_id: parseInt(course_id, 10),
        plo_id: parseInt(plo_id, 10),
        weight: parseFloat(scores[key]) || 0,
      };
    });
  
    console.log("Submitting scores:", scoresArray);
  
    // เรียก API POST เพื่อส่งข้อมูล
    fetch("http://localhost:8000/course_plo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        program_id: selectedProgram,
        scores: scoresArray,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          return response.json().then((data) => {
            throw new Error(data.message || "Failed to submit scores.");
          });
        }
        return response.json();
      })
      .then((data) => {
        if (data.success) {
          // อัปเดต weights state จาก scores ที่ส่งไป
          const updatedWeights = { ...weights };
          Object.keys(scores).forEach((key) => {
            updatedWeights[key] = scores[key];
          });
          setWeights(updatedWeights);
          setScores({}); // Clear scores after submission
  
          alert("Scores submitted successfully!");
          setEditingScores(false); // ยกเลิกโหมดแก้ไข
          
          // เพิ่มการโหลดข้อมูลใหม่เพื่อให้แน่ใจว่าข้อมูลถูกอัปเดต
          refreshDataFromServer();
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch((error) => {
        console.error("Error posting scores:", error.message);
        alert(`An error occurred while submitting scores: ${error.message}`);
      });
  };
  
  // เพิ่มฟังก์ชันใหม่สำหรับรีโหลดข้อมูลจากเซิร์ฟเวอร์
  const refreshDataFromServer = () => {
    if (!selectedProgram) return;
    
    // โหลดข้อมูลการแมปใหม่
    fetch(`http://localhost:8000/course_plo?program_id=${selectedProgram}`)
      .then(response => response.json())
      .then(data => {
        console.log("Refreshed mapping data:", data);
        const weightsData = {};
        
        // รับข้อมูลที่อยู่ในรูปแบบที่สม่ำเสมอ (data.message จะเป็น array เสมอ)
        const mappingArray = data.success ? data.message : [];
        
        // สร้าง weights object
        mappingArray.forEach(item => {
          const key = `${item.course_id}-${item.plo_id}`;
          weightsData[key] = item.weight;
        });
        
        setWeights(weightsData);
        setScores({}); // ล้างข้อมูล scores หลังจากบันทึกสำเร็จ
      })
      .catch(error => {
        console.error("Error refreshing data:", error);
      });
  };

  const handlePatchScores = () => {
    if (Object.keys(scores).length === 0) {
      alert("No changes to update. Please make some changes first.");
      return;
    }
  
    const updatedScores = Object.keys(scores).map((key) => {
      const [course_id, plo_id] = key.split("-");
      return {
        program_id: parseInt(selectedProgram),
        course_id: parseInt(course_id),
        plo_id: parseInt(plo_id),
        weight: parseFloat(scores[key]) || 0,
      };
    });
  
    // Create a copy of weights to update
    const updatedWeights = { ...weights };
  
    // ใช้ Promise.all เพื่อส่ง PATCH requests ทั้งหมดในคราวเดียว
    Promise.all(
      updatedScores.map((score) =>
        fetch("http://localhost:8000/course_plo", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(score),
        })
          .then((response) => {
            if (!response.ok) {
              return response.json().then((data) => {
                throw new Error(data.message || "Failed to update score");
              });
            }
            return response.json();
          })
          .then((data) => {
            // Update weights for this specific course-plo pair
            const key = `${score.course_id}-${score.plo_id}`;
            updatedWeights[key] = score.weight;
  
            // Handle success for each individual score update
            console.log(
              `Successfully updated Course ID: ${score.course_id}, PLO ID: ${score.plo_id}`
            );
          })
          .catch((error) => {
            console.error("Error updating score:", error.message);
            alert(
              `Error updating score for Course ID: ${score.course_id}, PLO ID: ${score.plo_id} - ${error.message}`
            );
          })
      )
    )
      .then(() => {
        // Update weights state with all the updated values
        setWeights(updatedWeights);
  
        alert("All scores updated successfully!");
        setEditingScores(false); // ยกเลิกโหมดแก้ไขเมื่อสำเร็จ
        
        // เพิ่มการโหลดข้อมูลใหม่เพื่อให้แน่ใจว่าข้อมูลถูกอัปเดต
        refreshDataFromServer();
      })
      .catch((error) => {
        console.error("Error during batch update:", error.message);
        alert("Error updating scores. Please try again.");
      });
  };

  const handleFileUpload = (e) => {
    let fileTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];
    let selectedFile = e.target.files[0];

    if (selectedFile) {
      if (fileTypes.includes(selectedFile.type)) {
        setTypeError(null);
        let reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = event.target.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            // เพิ่ม program_id ที่ผู้ใช้เลือกเข้าไปในแต่ละแถว
            const updatedData = jsonData.map((row) => ({
              ...row,
              program_id: selectedProgram, // เพิ่ม program_id ที่เลือกจาก UI
            }));

            setExcelData(updatedData); // เก็บข้อมูลจากไฟล์
            console.log(updatedData);
          } catch (error) {
            console.error("Error reading file:", error);
          }
        };
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
        };
        reader.readAsBinaryString(selectedFile);
      } else {
        setTypeError("Please select only Excel file types");
        setExcelData(null);
      }
    } else {
      console.log("Please select your file");
    }
  };

  const handleUploadButtonClick = () => {
    if (excelData) {
      fetch("http://localhost:8000/plo/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(excelData),
      })
        .then((response) => {
          if (!response.ok) {
            return response.text().then((text) => {
              throw new Error(text);
            });
          }
          return response.json();
        })
        .then((data) => {
          console.log("Success:", data);
          alert("Data Uploaded Successfully!");
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred: " + error.message);
        });
    } else {
      console.error("No data to upload");
    }
  };

  const handlePasteButtonClick = async () => {
    try {
      // อ่านข้อมูลจาก Clipboard
      const text = await navigator.clipboard.readText();

      // ใช้ XLSX เพื่อแปลงข้อมูลที่วางเป็น JSON
      const workbook = XLSX.read(text, { type: "string" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      // เพิ่ม program_id ให้กับทุกแถว
      const updatedData = jsonData.map((row) => ({
        ...row,
        program_id: selectedProgram, // ใส่ program_id ที่เลือก
      }));

      setExcelData(updatedData); // อัปเดตข้อมูลใน State
      console.log("Pasted Data:", updatedData);
    } catch (err) {
      console.error("Failed to paste data:", err);
      alert("Failed to paste data. Make sure you copied valid Excel data.");
    }
  };

  const handleAddPlo = () => {
    fetch("http://localhost:8000/plo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        PLO_name: newPlo.PLO_name,
        PLO_engname: newPlo.PLO_engname,
        PLO_code: newPlo.PLO_code,
        program_id: selectedProgram, // program ที่เลือกใน React
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setPlos([...plos, data.newPlo]); // อัปเดต PLO ใหม่ใน state
          setShowAddModal(false); // ปิด modal
          alert("PLO added successfully");
        } else {
          alert("Error adding PLO: " + data.message);
        }
      })
      .catch((error) => {
        console.error("Error adding PLO:", error);
        alert("An error occurred while adding the PLO");
      });
  };

  // แก้ไขฟังก์ชัน handleEditPlo
const handleEditPlo = (plo) => {
  console.log("Editing PLO:", plo); // เพิ่ม log เพื่อตรวจสอบข้อมูล
  setSelectedPlo(plo.plo_id); // เก็บ plo_id เพื่อใช้ในการอัปเดต
  setNewPlo({
    PLO_code: plo.PLO_code,
    PLO_name: plo.PLO_name,
    PLO_engname: plo.PLO_engname,
  });
  setShowEditModal(true);
};

// แก้ไขฟังก์ชัน handleUpdatePlo
const handleUpdatePlo = () => {
  // ค้นหา PLO โดยใช้ plo_id จาก selectedPlo
  if (!selectedPlo) {
    console.error("No PLO selected");
    alert("No PLO selected for update");
    return;
  }

  // Log ข้อมูลที่จะส่ง
  console.log("Updating PLO with data:", {
    program_id: parseInt(selectedProgram),
    plo_id: parseInt(selectedPlo),
    PLO_name: newPlo.PLO_name,
    PLO_engname: newPlo.PLO_engname,
    PLO_code: newPlo.PLO_code
  });

  // ส่งข้อมูลไปยัง API
  fetch("http://localhost:8000/program_plo", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      program_id: parseInt(selectedProgram),
      plo_id: parseInt(selectedPlo),
      PLO_name: newPlo.PLO_name,
      PLO_engname: newPlo.PLO_engname,
      PLO_code: newPlo.PLO_code // ส่ง PLO_code ไปด้วย แต่ API อาจไม่ได้ใช้
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.message || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then((data) => {
      if (data.success) {
        // อัปเดตข้อมูลใน state
        const updatedPlos = plos.map((plo) => {
          if (plo.plo_id === selectedPlo) {
            return {
              ...plo,
              PLO_name: newPlo.PLO_name,
              PLO_engname: newPlo.PLO_engname,
              PLO_code: newPlo.PLO_code // อัปเดต PLO_code ในข้อมูลที่แสดง
            };
          }
          return plo;
        });
        
        setPlos(updatedPlos);
        alert("PLO updated successfully");
        setShowEditModal(false);
      } else {
        console.error("Error updating PLO:", data);
        alert("Error updating PLO: " + (data.message || "Unknown error"));
      }
    })
    .catch((error) => {
      console.error("Error updating PLO:", error);
      alert("An error occurred while updating the PLO: " + error.message);
    });
};

  // เพิ่มตัวจัดการที่เหมาะสมสำหรับการเลือกโปรแกรม
  // In the handleProgramChange function, add code to update the selected year
  const handleProgramChange = (e) => {
    const programId = e.target.value;
    setSelectedProgram(programId);

    // If a program is selected, update the year filter to match the program's year
    if (programId) {
      const selectedProgramData = filteredPrograms.find(
        (p) => p.program_id.toString() === programId
      );
      if (selectedProgramData && selectedProgramData.year) {
        setSelectedYear(selectedProgramData.year.toString());
      }
    } else {
      // If no program selected, reset to "all"
      setSelectedYear("all");
    }

    // ล้างข้อมูลก่อนหน้าหากไม่มีการเลือกโปรแกรม
    if (!programId) {
      setPlos([]);
      setCourses([]);
      setWeights({});
    }
  };

  const handleLoadPreviousPLO = () => {
    // Find the previous year
    const currentYear = parseInt(selectedYear);
    const previousYear = currentYear - 1;

    fetch(
      `http://localhost:8000/program?faculty_id=${selectedFaculty}&year=${previousYear}`
    )
      .then((response) => response.json())
      .then((programs) => {
        if (programs.length === 0) {
          alert(
            `No programs found for faculty ${selectedFaculty} in year ${previousYear}`
          );
          return;
        }

        const previousYearProgram = programs[0];

        // Fetch PLOs for the previous year's program
        return fetch(
          `http://localhost:8000/program_plo?program_id=${previousYearProgram.program_id}`
        );
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setPreviousYearPLOs(data.message);
          setShowLoadPreviousPLOModal(true);
        } else {
          alert("No PLOs found for the previous year");
        }
      })
      .catch((error) => {
        console.error("Error loading previous year PLOs:", error);
        alert("An error occurred while loading previous year PLOs");
      });
  };

  const handleMergePLOs = () => {
    // Merge PLOs from previous year to current program
    const ploPatchRequests = previousYearPLOs.map((plo) =>
      fetch("http://localhost:8000/plo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          PLO_name: plo.PLO_name,
          PLO_engname: plo.PLO_engname,
          PLO_code: plo.PLO_code,
          program_id: selectedProgram,
        }),
      })
    );

    Promise.all(ploPatchRequests)
      .then((responses) => Promise.all(responses.map((r) => r.json())))
      .then((results) => {
        const successfulAdds = results.filter((r) => r.success);
        alert(`Successfully added ${successfulAdds.length} PLOs`);
        setShowLoadPreviousPLOModal(false);

        // Refresh PLOs for current program
        fetch(`http://localhost:8000/program_plo?program_id=${selectedProgram}`)
          .then((response) => response.json())
          .then((data) => setPlos(data.success ? data.message : []));
      })
      .catch((error) => {
        console.error("Error merging PLOs:", error);
        alert("An error occurred while merging PLOs");
      });
  };

  const pageStyle = {
    backgroundColor: "#ffffff",
    padding: "30px",
    maxWidth: "1200px",
    margin: "0 auto",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    borderRadius: "8px",
    fontFamily: "'Segoe UI', 'Roboto', sans-serif",
  };
  
  const headerStyle = {
    color: "#333333",
    borderBottom: "2px solid #f0f0f0",
    paddingBottom: "15px",
    marginBottom: "20px",
    textAlign: "center",
  };
  
  const formGroupStyle = {
    marginBottom: "15px",
    display: "flex",
    alignItems: "center",
  };
  
  const labelStyle = {
    width: "180px",
    marginRight: "10px",
  };
  
  const selectStyle = {
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ddd",
    minWidth: "250px",
  };
  
  const buttonStyle = {
    backgroundColor: "#4285f4",
    color: "white",
    border: "none",
    padding: "8px 16px",
    margin: "5px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px",
  };
  
  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: "#d93025",
  };
  
  const tableStyle = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "20px",
    border: "1px solid #ddd",
  };
  
  const thStyle = {
    backgroundColor: "#f2f2f2",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  };
  
  const tdStyle = {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  };


  return (
    <div style={{ backgroundColor: "#F0F0F0", minHeight: "100vh", paddingTop: '300px' }}>
      <div className="plo-management-container">
        <h1 className="text-center mb-4">Course-PLO Management</h1>

        {/* Filter Section */}
        <div className="filter-section">
          <div className="filter-item">
            <label className="filter-label">Choose a University:</label>
            <select
              className="form-select filter-select fixed-width-dropdown"
              value={selectedUniversity}
              onChange={handleUniversityChange}
            >
              <option value="all">All Universities</option>
              {universities.map((university) => (
                <option
                  key={university.university_id}
                  value={university.university_id}
                >
                  {university.university_name_en} ({university.university_name_th})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Choose a Faculty:</label>
            <select
              className="form-select filter-select fixed-width-dropdown"
              value={selectedFaculty}
              onChange={handleFacultyChange}
            >
              <option value="all">All Facultys</option>
              {facultys.map((faculty) => (
                <option key={faculty.faculty_id} value={faculty.faculty_id}>
                  {faculty.faculty_name_en} ({faculty.faculty_name_th})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Select Program:</label>
            <select
              className="form-select filter-select fixed-width-dropdown"
              onChange={handleProgramChange}
              value={selectedProgram || ""}
            >
              <option value="">All Programs</option>
              {getVisiblePrograms().map((program) => (
                <option key={program.program_id} value={program.program_id}>
                  {program.program_name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">Choose a Year:</label>
            <select
              className="form-select filter-select fixed-width-dropdown"
              value={selectedYear}
              onChange={handleYearChange}
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <hr className="my-4" />

        {/* PLO List Section */}
        <h2>PLO List</h2>
        
        <div className="action-buttons">
          <div className="button-group">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn"
              style={{ backgroundColor: "#FF8C00", color: "white" }}
            >
              Add PLO
            </button>
            
            <button
              onClick={handleLoadPreviousPLO}
              className="btn btn-secondary"
            >
              Load Previous Year PLOs
            </button>
          </div>
          
          <div className="button-group ms-auto">
            <button
              onClick={() => document.getElementById('uploadFile').click()}
              className="btn btn-secondary"
            >
              Upload Excel
            </button>
            <input
              type="file"
              id="uploadFile"
              style={{ display: 'none' }}
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
            />
            
            <button
              onClick={handlePasteButtonClick}
              className="btn"
              style={{ backgroundColor: "#00BFFF", color: "white" }}
            >
              Paste Data
            </button>
            
            <button
              onClick={handleUploadButtonClick}
              className="btn btn-success"
              disabled={!excelData}
            >
              Submit Excel Data
            </button>
          </div>
        </div>

        {typeError && (
          <div className="alert alert-danger mb-3">{typeError}</div>
        )}

        {/* PLO Table */}
        <div className="plo-table-container">
          <table className="plo-table">
            <thead>
              <tr>
                <th className="plo-code-col">PLO Code</th>
                <th className="plo-name-col">PLO Name</th>
                <th className="plo-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plos.map((plo) => (
                <tr key={plo.plo_id}>
                  <td>
                    <div className="plo-cell-content text-center">{plo.PLO_code}</div>
                  </td>
                  <td>
                    <div className="plo-cell-content">{plo.PLO_name}</div>
                    {plo.PLO_engname && (
                      <>
                        <div className="my-1 border-t border-gray-300"></div>
                        <div className="plo-cell-secondary">{plo.PLO_engname}</div>
                      </>
                    )}
                  </td>
                  <td>
                    <button
                      className="plo-table-btn plo-edit-btn"
                      onClick={() => handleEditPlo(plo)}
                    >
                      Edit
                    </button>
                    <button
                      className="plo-table-btn plo-delete-btn"
                      onClick={() => handleDeletePlo(plo.plo_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <hr className="my-4" />

        {/* Course-PLO Mapping Section */}
        <h2>Course-PLO Mapping</h2>
        <div className="action-buttons mb-3">
          <button 
            onClick={handleEditToggle}
            className="btn btn-primary me-2"
          >
            {editingScores ? "Cancel Edit" : "Edit"}
          </button>
          
          <button 
            onClick={handlePatchScores} 
            disabled={!editingScores}
            className="btn btn-success me-2"
          >
            Confirm
          </button>
          
          <button 
            onClick={handlePostScores} 
            disabled={!editingScores}
            className="btn"
            style={{ backgroundColor: "#FF8C00", color: "white" }}
          >
            Submit New Scores
          </button>
        </div>

        {/* Course-PLO Mapping Table with full functionality from original document */}
        <table 
          style={{
            borderCollapse: "collapse",
            width: "100%",
            marginTop: "15px",
            border: "2px solid black",
          }}
        >
          <thead>
            <tr>
              <th 
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
                rowSpan="2"
              >
                Course
              </th>
              <th 
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                  backgroundColor: "#f2f2f2"
                }}
                colSpan={plos.length}
              >
                PLO
              </th>
              <th 
                style={{
                  border: "1px solid black",
                  padding: "10px",
                  textAlign: "center",
                }}
                rowSpan="2"
              >
                Total
              </th>
            </tr>
            <tr>
              {plos.map((plo) => (
                <th
                  key={plo.plo_id}
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    textAlign: "center",
                  }}
                >
                  {plo.PLO_code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.course_id}>
                <td style={{ border: "1px solid black", padding: "10px" }}>
                  {course.course_id} {course.course_name}
                </td>
                {plos.map((plo) => {
                  const key = `${course.course_id}-${plo.plo_id}`;
                  return (
                    <td
                      key={plo.plo_id}
                      style={{
                        border: "1px solid black",
                        padding: "10px",
                        textAlign: "center",
                      }}
                    >
                      {editingScores ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scores[key] || ""}
                          onChange={(e) =>
                            handleInputChange(
                              course.course_id,
                              plo.plo_id,
                              e.target.value
                            )
                          }
                          style={{
                            width: "60px",
                            padding: "5px",
                            textAlign: "center",
                          }}
                        />
                      ) : (
                        (weights[key] !== undefined ? weights[key] : "-") || "-"
                      )}
                    </td>
                  );
                })}
                <td
                  style={{
                    border: "1px solid black",
                    padding: "10px",
                    textAlign: "center",
                    fontWeight: "bold",
                  }}
                >
                  {calculateTotal(course.course_id)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Modal and other components remain the same as in the original document */}
        {/* (You would include the existing modal code here) */}
      </div>
    </div>
  );
};

export default CoursePloManagement;


