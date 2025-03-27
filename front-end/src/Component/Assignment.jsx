

import { useState, useEffect } from "react"
import { FaBars } from "react-icons/fa"
import * as XLSX from "xlsx"

function Assignment() {
  // ย้าย hooks ทั้งหมดมาไว้ที่ระดับบนสุดของ component
  // State variables for all steps
  // เพิ่มตัวแปรเพื่อเก็บข้อมูลการบ้านปัจจุบันที่กำลังทำงานอยู่
const [currentAssignment, setCurrentAssignment] = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Step 1: Assignment Information state
  const [universities, setUniversities] = useState([])
  const [facultys, setFacultys] = useState([])
  const [programs, setPrograms] = useState([])
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [selectedFaculty, setSelectedFaculty] = useState("")
  const [selectedProgram, setSelectedProgram] = useState("")
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [selectedSemesterId, setSelectedSemesterId] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [assignmentName, setAssignmentName] = useState("")
  const [typeError, setTypeError] = useState(null)
  const [programCourseData, setProgramCourseData] = useState({
    courses: [],
    sections: [],
    semesters: [],
    years: [],
  })

  // Step 2: CLO Scoring System state
  const [CLOs, setCLOs] = useState([])
  const [plos, setPlos] = useState([])
  const [homeworks, setHomeworks] = useState([])
  const [validationErrors, setValidationErrors] = useState({})
  const [cloWeights, setCloWeights] = useState({})
  const [mappings, setMappings] = useState([]) // For PLO-CLO mappings
  const [editingScores, setEditingScores] = useState(false)
  const [course, setCourse] = useState("")
  const [scores, setScores] = useState({})
  const [weights, setWeights] = useState({})

  // Step 3: Import Students state
  const [importedStudents, setImportedStudents] = useState([])
  const [clipboardText, setClipboardText] = useState("")
  const [importErrors, setImportErrors] = useState([])
  const [importSuccess, setImportSuccess] = useState("")
  const [excelData, setExcelData] = useState(null)
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null)

  // Other state variables
  const [assignments, setAssignments] = useState([])
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedStudentName, setSelectedStudentName] = useState("")
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedAssignmentName, setSelectedAssignmentName] = useState("")
  const [allFiltersSelected, setAllFiltersSelected] = useState(false)
  const [year, setYear] = useState("")
  const [courses, setCourses] = useState([])

  // Fetch universities on component mount
  useEffect(() => {
    fetch("http://localhost:8000/university")
      .then((response) => response.json())
      .then((data) => {
        setUniversities(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching universities:", error)
        setError("Error fetching universities")
        setLoading(false)
      })
  }, [])

  // Fetch faculties when university is selected
  useEffect(() => {
    if (!selectedUniversity) return

    fetch(`http://localhost:8000/faculty?university_id=${selectedUniversity}`)
      .then(async (response) => {
        if (!response.ok) {
          console.error(`HTTP Error: ${response.status}`)
          return response.text().then((text) => {
            throw new Error(text || `HTTP ${response.status}`)
          })
        }
        const text = await response.text()
        return text ? JSON.parse(text) : []
      })
      .then((data) => {
        const formattedData = Array.isArray(data) ? data : [data]
        console.log("Formatted Facultys:", formattedData)
        setFacultys(formattedData)
      })
      .catch((error) => {
        console.error(" Error fetching facultys:", error)
        setFacultys([])
      })
  }, [selectedUniversity])

  // Fetch programs when faculty is selected
  useEffect(() => {
    if (selectedFaculty) {
      fetch(`http://localhost:8000/program?faculty_id=${selectedFaculty}`)
        .then((response) => response.json())
        .then((data) => setPrograms(data))
        .catch((error) => console.error("Error fetching programs:", error))
    }
  }, [selectedFaculty])

  // Fetch course data when program is selected
  useEffect(() => {
    if (selectedProgram) {
      // Convert selectedProgram to a string to ensure type consistency
      const programId = String(selectedProgram)

      console.log("Fetching courses for Program ID:", programId)

      fetch(`http://localhost:8000/program_courses_detail?program_id=${programId}`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          return response.json()
        })
        .then((data) => {
          console.log("Raw Courses Data for Program:", data)

          if (data && data.length > 0) {
            // Filter unique courses
            const uniqueCourses = data.reduce((acc, course) => {
              const existingCourse = acc.find((c) => c.course_id === course.course_id)

              if (!existingCourse) {
                acc.push({
                  course_id: course.course_id,
                  course_name: course.course_name,
                  course_engname: course.course_engname,
                  program_name: course.program_name,
                })
              }

              return acc
            }, [])

            // Extract unique sections
            const uniqueSections = [...new Set(data.map((item) => item.section_id))]

            // Extract unique semesters
            const uniqueSemesters = [...new Set(data.map((item) => item.semester_id))]

            // Extract unique years
            const uniqueYears = [...new Set(data.map((item) => item.year))]

            console.log("Unique Courses:", uniqueCourses)
            console.log("Unique Sections:", uniqueSections)
            console.log("Unique Semesters:", uniqueSemesters)
            console.log("Unique Years:", uniqueYears)

            setProgramCourseData((prevData) => ({
              ...prevData,
              courses: uniqueCourses,
              sections: uniqueSections,
              semesters: uniqueSemesters,
              years: uniqueYears,
            }))
          } else {
            console.warn("No courses found for this program")
            setProgramCourseData((prevData) => ({
              ...prevData,
              courses: [],
              sections: [],
              semesters: [],
              years: [],
            }))
          }
        })
        .catch((error) => {
          console.error("Error fetching program courses:", error)
          setProgramCourseData((prevData) => ({
            ...prevData,
            courses: [],
            sections: [],
            semesters: [],
            years: [],
          }))
        })
    }
  }, [selectedProgram])

  // Fetch assignments for the selected course, section, semester, and year
  useEffect(() => {
    if (selectedCourseId && selectedSectionId && selectedSemesterId && selectedYear && selectedProgram) {
      setLoading(true)
      fetch(
        `http://localhost:8000/api/get_course_assignments?course_id=${selectedCourseId}&section_id=${selectedSectionId}&semester_id=${selectedSemesterId}&year=${selectedYear}&program_id=${selectedProgram}`,
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch assignments")
          return response.json()
        })
        .then((data) => {
          console.log("Assignments data:", data)

          if (data.length > 0) {
            // Convert the database assignments to the format needed for the form
            const formattedHomeworks = data.map((assignment) => ({
              id: assignment.assignment_id,
              name: assignment.assignment_name,
              scores: {}, // Initialize empty scores for each homework
            }))
            setHomeworks(formattedHomeworks)
          } else {
            // If no assignments found, set to empty array
            setHomeworks([])
          }

          setLoading(false)
        })
        .catch((error) => {
          console.error("Error fetching assignments:", error)
          setHomeworks([])
          setLoading(false)
        })
    }
  }, [selectedCourseId, selectedSectionId, selectedSemesterId, selectedYear, selectedProgram])

  // Fetch CLOs for selected course, section, semester, and year
  useEffect(() => {
    if (selectedCourseId && selectedSectionId && selectedSemesterId && selectedYear && selectedProgram) {
      // Find the program data first
      const selectedProgramData = programs.find(
        (program) => program.program_id.toString() === selectedProgram.toString(),
      )

      if (!selectedProgramData) {
        console.error("Program not found:", selectedProgram)
        setCLOs([])
        setMappings([])
        setPlos([])
        return
      }

      const programId = selectedProgramData.program_id

      // แก้ไขชื่อ API จาก course_clo เป็น assignment_clo
      fetch(
        `http://localhost:8000/assignment_clo?program_id=${programId}&course_id=${selectedCourseId}&semester_id=${selectedSemesterId}&section_id=${selectedSectionId}&year=${selectedYear}`,
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch CLOs")
          return response.json()
        })
        .then((cloData) => {
          console.log("CLO Data received:", cloData)
          const formattedCLOs = Array.isArray(cloData) ? cloData : [cloData]
          setCLOs(formattedCLOs)

          // Initialize CLO weights
          const initialWeights = {}
          formattedCLOs.forEach((clo) => {
            // ฟิลด์ CLO_id แทน clo_id ในข้อมูลที่ได้จาก API
            const cloId = clo.CLO_id || clo.clo_id
            initialWeights[cloId] = clo.weight || 10
          })
          setCloWeights(initialWeights)

          // Reset homework scores for the new CLOs
          resetHomeworkScores(formattedCLOs)
        })
        .catch((error) => {
          console.error("Error fetching CLOs:", error)
          setCLOs([])
          setCloWeights({})
        })
    }
  }, [selectedCourseId, selectedSectionId, selectedSemesterId, selectedYear, selectedProgram, programs])

  // Fetch PLO-CLO mappings
  useEffect(() => {
    if (selectedCourseId && selectedSectionId && selectedSemesterId && selectedYear && selectedProgram) {
      // Find the program data first
      const selectedProgramData = programs.find(
        (program) => program.program_id.toString() === selectedProgram.toString(),
      )

      if (!selectedProgramData) {
        console.error("Program not found:", selectedProgram)
        setMappings([])
        return
      }

      const programId = selectedProgramData.program_id

      // ดึงข้อมูลความสัมพันธ์ระหว่าง PLO และ CLO (ซึ่งมี weight)
      fetch(
        `http://localhost:8000/clo_mapping?course_id=${selectedCourseId}&section_id=${selectedSectionId}&semester_id=${selectedSemesterId}&year=${selectedYear}&program_id=${programId}`,
      )
        .then((response) => {
          if (!response.ok) throw new Error("Failed to fetch PLO-CLO mappings")
          return response.json()
        })
        .then((data) => {
          console.log("PLO-CLO Mapping data:", data)
          const formattedMappings = Array.isArray(data) ? data : [data]
          setMappings(formattedMappings)

          // อัปเดต weight ของ CLO จากข้อมูล mappings
          // สร้าง object ใหม่เพื่อเก็บ weight ของแต่ละ CLO
          const updatedWeights = {}

          // วนลูปผ่านข้อมูล mapping แต่ละรายการ
          formattedMappings.forEach((mapping) => {
            const cloId = mapping.CLO_id
            const weight = mapping.weight || 10 // ใช้ค่าเริ่มต้น 10 ถ้าไม่มี weight

            // ถ้ายังไม่มี weight สำหรับ CLO นี้ หรือ weight ที่พบมีค่ามากกว่าเดิม
            // ให้ใช้ weight นี้แทน (เพื่อให้ได้ weight สูงสุดของแต่ละ CLO)
            if (!updatedWeights[cloId] || weight > updatedWeights[cloId]) {
              updatedWeights[cloId] = weight
            }
          })

          // อัปเดต state cloWeights
          setCloWeights(updatedWeights)

          // ตรวจสอบการอัปเดต
          console.log("Updated CLO weights from mappings:", updatedWeights)
        })
        .catch((error) => {
          console.error("Error fetching PLO-CLO mappings:", error)
          setMappings([])
        })
    }
  }, [selectedCourseId, selectedSectionId, selectedSemesterId, selectedYear, selectedProgram, programs])

  // Fetch all assignments
  useEffect(() => {
    setLoading(true)
    fetch("http://localhost:8000/api/get_assignments")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log("Assignments data:", data)
        setAssignments(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error("Error fetching assignments:", error)
        setError(error.message)
        setLoading(false)
      })
  }, [])

  // Update currentAssignmentId when homeworks change
  useEffect(() => {
    if (homeworks.length > 0 && homeworks[0].id) {
      setCurrentAssignmentId(homeworks[0].id);
      console.log("Current Assignment ID set to:", homeworks[0].id);
    } else {
      setCurrentAssignmentId(null);
    }
  }, [homeworks]);

  // Reset homework scores when CLOs change
  const resetHomeworkScores = (clos) => {
    const updatedHomeworks = homeworks.map((hw) => {
      const newScores = {}
      clos.forEach((clo) => {
        // Support both CLO_id and clo_id
        const cloId = clo.CLO_id || clo.clo_id
        newScores[cloId] = 0
      })

      return {
        ...hw,
        scores: newScores,
      }
    })

    setHomeworks(updatedHomeworks)
    setValidationErrors({})
  }

  // Validate CLO scores
  const validateCloScores = () => {
    const errors = {}

    // For each CLO
    CLOs.forEach((clo) => {
      // รองรับทั้ง CLO_id และ clo_id
      const cloId = clo.CLO_id || clo.clo_id
      // ใช้ weight จาก cloWeights ที่อัปเดตจาก mappings
      const maxWeight = cloWeights[cloId] || 10 // ใช้ค่าเริ่มต้น 10 ถ้าไม่มี weight

      // Calculate total across all homeworks for this CLO
      const total = homeworks.reduce((sum, hw) => {
        return sum + (hw.scores[cloId] || 0)
      }, 0)

      // If total exceeds max weight, mark as error
      if (total > maxWeight) {
        const cloCode = clo.CLO_code || `CLO${cloId}`
        errors[cloId] = `Total scores (${total}) exceed the maximum weight (${maxWeight}) for ${cloCode}`
      }
    })

    setValidationErrors(errors)
    return errors
  }

  // Handle saving Step 1
  const handleSaveStep1 = () => {
    if (
      !selectedProgram ||
      !selectedCourseId ||
      !selectedSectionId ||
      !selectedSemesterId ||
      !selectedYear ||
      !assignmentName
    ) {
      setTypeError("กรุณากรอกข้อมูลทั้งหมดก่อนบันทึก")
      return
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
      university_id: selectedUniversity,
    }

    console.log("Sending data:", newAssignment)

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
          console.error("Error status:", response.status)
          return response.json().then((data) => {
            console.error("Error details:", data)
            throw new Error(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
          })
        }
        return response.json()
      })
      .then((data) => {
        if (data && (data.success || data.message === "Assignment บันทึกสำเร็จ")) {
          alert("บันทึก Assignment สำเร็จ!")

          // ไปยัง Step 2 หลังจากบันทึกสำเร็จ
          setCurrentStep(2)

          // สร้าง homework ใหม่จาก assignment ที่บันทึก
          if (data.assignment_id) {
            const newHomework = {
              id: data.assignment_id,
              name: assignmentName,
              scores: {},
            }

            // ถ้า CLOs มีข้อมูลแล้ว กำหนดคะแนนเริ่มต้นเป็น 0
            if (CLOs && CLOs.length > 0) {
              CLOs.forEach((clo) => {
                const cloId = clo.CLO_id || clo.clo_id
                newHomework.scores[cloId] = 0
              })
            }

            setHomeworks([newHomework])
          }
        } else {
          alert(data.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
        }
      })
      .catch((error) => {
        console.error("Error saving Assignment:", error)
        alert(`เกิดข้อผิดพลาด: ${error.message}`)
      })
  }

  // Handle saving CLO scores in Step 2
  const handleSaveAssignment = () => {
    if (!selectedProgram || !selectedCourseId || !selectedSectionId || !selectedSemesterId || !selectedYear) {
      setTypeError("กรุณากรอกข้อมูลทั้งหมดก่อนบันทึก")
      return
    }

    // ตรวจสอบความถูกต้องของคะแนน CLO
    const validationErrors = validateCloScores()
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    // ตรวจสอบว่ามี homeworks หรือไม่
    if (!homeworks || homeworks.length === 0) {
      alert("ไม่พบข้อมูล Assignment ที่จะบันทึก")
      return
    }

    // สร้างข้อมูล API ในรูปแบบที่ถูกต้อง
    const prepareDataForApi = () => {
      // สร้าง array ของข้อมูล CLO สำหรับทุก homework
      const apiData = []

      homeworks.forEach((hw) => {
        // วนลูปสำหรับแต่ละ CLO ใน homework
        for (const cloId in hw.scores) {
          if (Object.prototype.hasOwnProperty.call(hw.scores, cloId)) {
            const score = hw.scores[cloId]

            // ใช้ weight จาก cloWeights ที่อัปเดตจาก mappings
            const weight = cloWeights[cloId] || 10 // ใช้ค่าเริ่มต้น 10 ถ้าไม่มี weight

            // เพิ่มข้อมูลในรูปแบบที่ API ต้องการ
            apiData.push({
              assignment_id: hw.id,
              item: {
                clo_id: cloId,
              },
              score: score,
              weight: weight,
            })
          }
        }
      })

      return apiData
    }

    // บันทึกข้อมูล
    const saveData = async () => {
      try {
        const dataToSend = prepareDataForApi()

        console.log("Data being sent to API:", {
          data: dataToSend,
        })

        const response = await fetch("http://localhost:8000/api/save_assignment_clo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: dataToSend,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Error response:", errorData)
          throw new Error(errorData.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล")
        }

        const result = await response.json()
        console.log("Save result:", result)

        // แสดงข้อความเมื่อบันทึกสำเร็จ
        alert("บันทึกคะแนน CLO สำเร็จ!")
      } catch (error) {
        console.error("Error saving assignment CLO scores:", error)
        alert(`เกิดข้อผิดพลาด: ${error.message}`)
      }
    }


    // เริ่มการบันทึกข้อมูล
    saveData()
      
// เพิ่มบรรทัดนี้: หลังจากบันทึกสำเร็จให้ไปยัง Step 3
setCurrentStep(3)
  }

  // Handle changing scores for a homework and CLO
  const handleScoreChange = (homeworkId, cloId, value) => {
    // Convert to number or default to 0 if empty
    const numValue = value === "" ? 0 : Number.parseInt(value, 10)

    // Update the homework scores
    const updatedHomeworks = homeworks.map((hw) => {
      if (hw.id === homeworkId) {
        return {
          ...hw,
          scores: {
            ...hw.scores,
            [cloId]: numValue,
          },
        }
      }
      return hw
    })

    setHomeworks(updatedHomeworks)

    // Validate scores after change
    setTimeout(() => validateCloScores(), 100)
  }

  // Calculate total scores for a specific CLO across all homeworks
  const calculateCloTotal = (cloId) => {
    return homeworks.reduce((total, hw) => {
      return total + (hw.scores[cloId] || 0)
    }, 0)
  }

  // Function to go to the next step
  const goToNextStep = () => {
    setCurrentStep((prevStep) => prevStep + 1)
  }

  // Function to go to the previous step
  const goToPreviousStep = () => {
    setCurrentStep((prevStep) => prevStep - 1)
  }

  // Function to go from Step 2 to Step 3
  const goToStep3 = () => {
    if (homeworks.length === 0) {
      alert("กรุณาสร้างการบ้านก่อนนำเข้ารายชื่อนักเรียน")
      return
    }

    // Check if there are unsaved changes in Step 2
    // If all validations pass, go to step 3
    setCurrentStep(3)
  }

  // Function to get background color based on score value
  const getScoreColor = (score) => {
    if (score === 0) return ""
    if (score < 5) return "bg-danger text-white"
    if (score < 8) return "bg-warning"
    return "bg-success text-white"
  }

  // Function to handle Excel file upload
  const handleExcelFileUpload = (e) => {
    const file = e.target.files[0]
    setImportErrors([])
    setImportSuccess("")

    if (!file) return

    // Reset previously imported data
    setExcelData(null)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: "array" })

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        if (jsonData.length === 0) {
          setImportErrors(["ไม่พบข้อมูลในไฟล์ Excel"])
          return
        }

        // Validate required columns
        const firstRow = jsonData[0]
        const hasStudentId = "student_id" in firstRow || "รหัสนักศึกษา" in firstRow
        const hasName = "name" in firstRow || "ชื่อ-นามสกุล" in firstRow || "ชื่อ" in firstRow

        if (!hasStudentId || !hasName) {
          setImportErrors(["ไฟล์ Excel ต้องมีคอลัมน์ 'student_id' (หรือ 'รหัสนักศึกษา') และ 'name' (หรือ 'ชื่อ-นามสกุล', 'ชื่อ')"])
          return
        }

        // Process and normalize data
        const processedData = jsonData
          .map((row) => {
            // Try to find student_id in various possible column names
            const studentId = row.student_id || row.รหัสนักศึกษา || row["รหัสนักศึกษา"]
            // Try to find name in various possible column names
            const name = row.name || row["ชื่อ-นามสกุล"] || row.ชื่อ

            return {
              student_id: studentId ? String(studentId).trim() : "",
              name: name ? String(name).trim() : "",
            }
          })
          .filter((student) => student.student_id && student.name)

        if (processedData.length === 0) {
          setImportErrors(["ไม่พบข้อมูลที่ถูกต้องในไฟล์ Excel"])
          return
        }

        setExcelData(processedData)
      } catch (error) {
        console.error("Error reading Excel file:", error)
        setImportErrors(["เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: " + error.message])
      }
    }

    reader.onerror = (error) => {
      console.error("FileReader error:", error)
      setImportErrors(["เกิดข้อผิดพลาดในการอ่านไฟล์: " + error.message])
    }

    reader.readAsArrayBuffer(file)
  }

  // Function to import students from Excel data
  const handleImportFromExcel = () => {
    if (!excelData || excelData.length === 0) {
      setImportErrors(["ไม่พบข้อมูลที่จะนำเข้า"])
      return
    }

    setImportErrors([])
    setImportSuccess("")

    // Validate data
    const errors = []
    excelData.forEach((student, index) => {
      if (!student.student_id) {
        errors.push(`แถวที่ ${index + 1}: ไม่พบรหัสนักศึกษา`)
      } else if (!/^\d{8,13}$/.test(student.student_id)) {
        errors.push(`แถวที่ ${index + 1}: รหัสนักศึกษา ${student.student_id} ไม่ถูกต้อง (ต้องเป็นตัวเลข 8-13 หลัก)`)
      }

      if (!student.name) {
        errors.push(`แถวที่ ${index + 1}: ไม่พบชื่อ-นามสกุล`)
      }
    })

    if (errors.length > 0) {
      setImportErrors(errors)
      return
    }

    // Import to list
    setImportedStudents([...importedStudents, ...excelData])
    setImportSuccess(`นำเข้ารายชื่อนักเรียนจาก Excel จำนวน ${excelData.length} คน สำเร็จ`)
    setExcelData(null)

    // Reset file input
    const fileInput = document.querySelector('input[type="file"]')
    if (fileInput) fileInput.value = ""
  }

  // Function to import students from clipboard
  const handleImportFromClipboard = () => {
    if (!clipboardText.trim()) {
      setImportErrors(["ไม่พบข้อมูลที่จะนำเข้า"])
      return
    }

    setImportErrors([])
    setImportSuccess("")

    // Process clipboard text
    // Expecting format: "student_id[tab]name" or "student_id[space]name" per line
    const lines = clipboardText.trim().split(/\r?\n/)
    const parsedStudents = []
    const errors = []

    lines.forEach((line, index) => {
      // Try to split by tab first, then by multiple spaces
      const parts = line.trim().split(/\t+/)
      let studentId, name

      if (parts.length >= 2) {
        // If split by tab works
        studentId = parts[0].trim()
        name = parts.slice(1).join(" ").trim()
      } else {
        // Try splitting by multiple spaces
        const spaceParts = line.trim().split(/\s{2,}/)
        if (spaceParts.length >= 2) {
          studentId = spaceParts[0].trim()
          name = spaceParts.slice(1).join(" ").trim()
        } else {
          // Try to find a pattern where numbers are followed by text
          const match = line.match(/^(\d+)\s+(.+)$/)
          if (match) {
            studentId = match[1].trim()
            name = match[2].trim()
          } else {
            errors.push(`บรรทัดที่ ${index + 1}: รูปแบบไม่ถูกต้อง "${line}"`)
            return
          }
        }
      }

      // Validate student ID
      if (!studentId) {
        errors.push(`บรรทัดที่ ${index + 1}: ไม่พบรหัสนักศึกษา`)
      } else if (!/^\d{8,13}$/.test(studentId)) {
        errors.push(`บรรทัดที่ ${index + 1}: รหัสนักศึกษา ${studentId} ไม่ถูกต้อง (ต้องเป็นตัวเลข 8-13 หลัก)`)
      }

      // Validate name
      if (!name) {
        errors.push(`บรรทัดที่ ${index + 1}: ไม่พบชื่อ-นามสกุล`)
      }

      if (studentId && name) {
        parsedStudents.push({
          student_id: studentId,
          name: name,
        })
      }
    })

    if (errors.length > 0) {
      setImportErrors(errors)
      return
    }

    if (parsedStudents.length === 0) {
      setImportErrors(["ไม่สามารถแยกแยะข้อมูลนักเรียนได้ โปรดตรวจสอบรูปแบบข้อมูล"])
      return
    }

    // Add to imported students list
    setImportedStudents([...importedStudents, ...parsedStudents])
    setImportSuccess(`นำเข้ารายชื่อนักเรียนจาก Clipboard จำนวน ${parsedStudents.length} คน สำเร็จ`)
    setClipboardText("")
  }

  // Function to remove a student from the imported list
  const handleRemoveStudent = (index) => {
    const updatedStudents = [...importedStudents]
    updatedStudents.splice(index, 1)
    setImportedStudents(updatedStudents)
  }

  // Function to save imported students to the assignment
 // แก้ไขฟังก์ชัน handleSaveImportedStudents
// แก้ไขฟังก์ชัน handleSaveImportedStudents
const handleSaveImportedStudents = () => {
  if (importedStudents.length === 0) {
    setImportErrors(["ไม่พบรายชื่อนักเรียนที่จะบันทึก"])
    return
  }

  // ตรวจสอบว่ามี currentAssignmentId หรือไม่
  if (!currentAssignmentId) {
    // ถ้าไม่มี currentAssignmentId แต่มี homeworks
    if (homeworks.length > 0 && homeworks[0].id) {
      // ใช้ id จาก homework แรก
      setCurrentAssignmentId(homeworks[0].id)
      console.log("Setting current assignment ID from homework:", homeworks[0].id)
    } else {
      setImportErrors(["ไม่พบข้อมูลการบ้านที่จะบันทึก กรุณาเลือกการบ้านอีกครั้ง"])
      return
    }
  }
  
  // ใช้ค่า currentAssignmentId ที่เป็นปัจจุบัน
  const assignmentIdToUse = currentAssignmentId || (homeworks.length > 0 ? homeworks[0].id : null)
  
  console.log("Using assignment ID:", assignmentIdToUse)
  
  if (!assignmentIdToUse) {
    setImportErrors(["ไม่พบข้อมูลการบ้านที่จะบันทึก กรุณาเลือกการบ้านอีกครั้ง"])
    return
  }

  setLoading(true)
  setImportErrors([])
  setImportSuccess("")

  // แสดงข้อมูลที่จะส่งในคอนโซล
  const studentsData = importedStudents.map((student) => ({
    student_id: student.student_id,
    assignment_id: assignmentIdToUse,
    // ไม่ต้องส่ง assignment_clo_id เพราะ backend จะดึงข้อมูลทั้งหมดจาก assignment_id
    // และทำการเชื่อมโยงกับ CLO ทั้งหมดให้อัตโนมัติ
  }))
  
  console.log("Data being sent to API:", {
    students: studentsData
  })
    
  // ส่งข้อมูลไป API
  fetch("http://localhost:8000/api/add_students_to_assignment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      students: studentsData,
    }),
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then(text => {
          try {
            return JSON.parse(text)
          } catch (e) {
            throw new Error(text || "Failed to add students to assignment")
          }
        })
      }
      return response.json()
    })
    .then((data) => {
      console.log("Response from server:", data);
      setImportSuccess(`บันทึกรายชื่อนักเรียนสำเร็จ: ${data.message || `จำนวน ${importedStudents.length} คน`}`);
      setImportedStudents([]);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Error saving students:", error)
      setImportErrors([`เกิดข้อผิดพลาดในการบันทึกข้อมูล: ${error.message}`])
      setLoading(false)
    })
}

  // Handle adding a student to an assignment
  const handleAddStudentToAssignment = (studentId, assignmentId) => {
    const student = students.find((s) => s.student_id === studentId)
    const assignment = assignments.find((a) => a.assignment_id === assignmentId)

    if (student && assignment) {
      console.log("Adding student to assignment...")
      console.log("Student ID:", student.student_id)
      console.log("Student Name:", student.name)
      console.log("Course:", assignment.course_name)
      console.log("Assignment Name:", assignment.assignment_name)
      console.log("Year:", assignment.year)

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
          year: assignment.year,
        }),
      })
        .then((response) => {
          if (!response.ok) {
            return response.json().then((data) => {
              console.error("Server error details:", data)
              throw new Error(data.message || "Failed to add student")
            })
          }
          return response.json()
        })
        .then((data) => {
          if (data.message) {
            alert("Student added successfully!")
          }
        })
        .catch((error) => {
          console.error("Error adding student:", error)
          alert("Error: " + error.message)
        })
    } else {
      console.error("Student or assignment not found")
      alert("Student or assignment information is missing.")
    }
  }

  // Handle selecting a program
  const handleSelectProgram = (programName) => {
    setSelectedProgram(programName)
    setSelectedCourseId("")
    setSelectedSectionId("")
    setSelectedSemesterId("")
    setSelectedYear("")
  }

  // Render loading state
  if (loading) return <div>กำลังโหลดข้อมูล...</div>
  if (error) return <div>เกิดข้อผิดพลาด: {error}</div>

  return (
    <div
      className="container-fluid py-4 d-flex flex-column min-vh-100"
      style={{ backgroundColor: "#f9f9f9", overflowX: "hidden", paddingTop: "70px" }}
    >
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
              style={{
                width: currentStep === 1 ? "33%" : currentStep === 2 ? "66%" : "100%",
                fontSize: "14px",
              }}
              aria-valuenow={currentStep === 1 ? 33 : currentStep === 2 ? 66 : 100}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {currentStep === 1
                ? "Step 1: Assignment Information"
                : currentStep === 2
                  ? "Step 2: CLO Scoring System"
                  : "Step 3: Import Students"}
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
                      <option value="" disabled>
                        Select University
                      </option>
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
                      <option value="" disabled>
                        Select Faculty
                      </option>
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
                        const programValue = e.target.value
                        setSelectedProgram(programValue)
                      }}
                      disabled={!selectedFaculty}
                    >
                      <option value="" disabled>
                        Select Program
                      </option>
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
                        <option value="" disabled>
                          Select Course
                        </option>
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
                        <option value="" disabled>
                          Select Section
                        </option>
                        {programCourseData.sections.map((section) => (
                          <option key={section} value={section}>
                            {section}
                          </option>
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
                        <option value="" disabled>
                          Select Semester
                        </option>
                        {programCourseData.semesters.map((semester) => (
                          <option key={semester} value={semester}>
                            {semester}
                          </option>
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
                        <option value="" disabled>
                          Select Year
                        </option>
                        {programCourseData.years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="assignment-name" className="form-label">
                      Assignment Name
                    </label>
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
                    handleSaveStep1()
                  }}
                  disabled={
                    !(
                      selectedProgram &&
                      selectedCourseId &&
                      selectedSectionId &&
                      selectedSemesterId &&
                      selectedYear &&
                      assignmentName
                    )
                  }
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
                              <th className="text-center" style={{ width: "50px" }}>
                                No.
                              </th>
                              <th className="text-center" style={{ width: "200px" }}>
                                HW
                              </th>
                              {CLOs.map((clo) => {
                                const cloId = clo.CLO_id || clo.clo_id
                                return (
                                  <th key={cloId} className="text-center">
                                    {clo.CLO_code || `CLO${cloId}`}
                                  </th>
                                )
                              })}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Weights row (yellow) */}
                            <tr className="table-warning">
                              <td className="font-weight-bold"></td>
                              <td className="font-weight-bold text-center">น้ำหนักคะแนน</td>
                              {CLOs.map((clo) => {
                                const cloId = clo.CLO_id || clo.clo_id
                                const weight = cloWeights[cloId] || 0
                                return (
                                  <td key={cloId} className="text-center font-weight-bold">
                                    {weight}
                                  </td>
                                )
                              })}
                            </tr>

                            {/* Homework rows */}
                            {homeworks.map((hw, index) => (
                              <tr key={hw.id}>
                                <td className="text-center">{index + 1}</td>
                                <td>{hw.name}</td>
                                {CLOs.map((clo) => {
                                  const cloId = clo.CLO_id || clo.clo_id
                                  const currentScore = hw.scores[cloId] !== undefined ? hw.scores[cloId] : ""
                                  return (
                                    <td key={cloId} className={getScoreColor(currentScore || 0)}>
                                      <input
                                        type="number"
                                        min="0"
                                        max={cloWeights[cloId] || 10}
                                        value={currentScore}
                                        onChange={(e) => handleScoreChange(hw.id, cloId, e.target.value)}
                                        className={`form-control form-control-sm text-center ${getScoreColor(currentScore || 0)}`}
                                        style={{ border: "none" }}
                                      />
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}

                            {/* Totals row */}
                            <tr className="table-secondary font-weight-bold">
                              <td></td>
                              <td className="text-center">รวม</td>
                              {CLOs.map((clo) => {
                                const cloId = clo.CLO_id || clo.clo_id
                                const total = calculateCloTotal(cloId)
                                const maxWeight = cloWeights[cloId] || 0
                                const isValid = total <= maxWeight

                                return (
                                  <td key={cloId} className={`text-center ${!isValid ? "text-danger" : ""}`}>
                                    {total} / {maxWeight}
                                  </td>
                                )
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
                              scores: {},
                            }
                            const newScores = {}
                            CLOs.forEach((clo) => {
                              const cloId = clo.CLO_id || clo.clo_id
                              newScores[cloId] = 0
                            })
                            newHomework.scores = newScores
                            setHomeworks([...homeworks, newHomework])
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

              <div className="d-flex justify-content-between mt-4">
                <button className="btn btn-secondary px-4" onClick={goToPreviousStep}>
                  <i className="fas fa-arrow-left me-2"></i> Back
                </button>
                <div>
                  <button
                    className="btn btn-success px-4 me-2"
                    onClick={handleSaveAssignment}
                    disabled={Object.keys(validationErrors).length > 0 || CLOs.length === 0}
                  >
                    <i className="fas fa-save me-2"></i> Save Assignment
                  </button>
                  <button
                    className="btn btn-primary px-4"
                    onClick={goToStep3}
                    disabled={Object.keys(validationErrors).length > 0 || CLOs.length === 0}
                  >
                    <i className="fas fa-arrow-right me-2"></i> Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Import Students from Excel or Clipboard */}
        {currentStep === 3 && (
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm mb-4">
                <div className="card-header bg-primary text-white">
                  <h5 className="mb-0 text-center">นำเข้ารายชื่อนักเรียน</h5>
                </div>
                <div className="card-body p-4">
                  <div className="row">
                    {/* Excel Import Section */}
                    <div className="col-md-6 mb-4">
                      <div className="card h-100 border-primary">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="fas fa-file-excel me-2 text-success"></i>
                            นำเข้าจากไฟล์ Excel
                          </h6>
                        </div>
                        <div className="card-body">
                          <p className="text-muted small mb-3">
                            รองรับไฟล์ .xlsx, .xls โดยต้องมีคอลัมน์ student_id และ name เป็นอย่างน้อย
                          </p>
                          <div className="mb-3">
                            <input
                              type="file"
                              className="form-control"
                              accept=".xlsx,.xls"
                              onChange={handleExcelFileUpload}
                            />
                          </div>
                          {excelData && (
                            <div className="alert alert-success">
                              <i className="fas fa-check-circle me-2"></i>
                              พบข้อมูลนักเรียน {excelData.length} คน
                            </div>
                          )}
                        </div>
                        <div className="card-footer bg-light">
                          <button
                            className="btn btn-primary w-100"
                            onClick={handleImportFromExcel}
                            disabled={!excelData || loading}
                          >
                            {loading ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                กำลังนำเข้า...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-file-import me-2"></i>
                                นำเข้าจาก Excel
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Clipboard Import Section */}
                    <div className="col-md-6 mb-4">
                      <div className="card h-100 border-primary">
                        <div className="card-header bg-light">
                          <h6 className="mb-0">
                            <i className="fas fa-clipboard me-2 text-info"></i>
                            นำเข้าจาก Clipboard
                          </h6>
                        </div>
                        <div className="card-body">
                          <p className="text-muted small mb-3">
                            วางข้อมูลในรูปแบบ: รหัสนักศึกษา[Tab]ชื่อ-นามสกุล แต่ละคนอยู่คนละบรรทัด
                          </p>
                          <div className="mb-3">
                            <textarea
                              className="form-control"
                              rows="8"
                              placeholder="6411234567	นายทดสอบ ระบบเรียน&#10;6411234568	นางสาวทดสอบ ระบบสอบ"
                              value={clipboardText}
                              onChange={(e) => setClipboardText(e.target.value)}
                            ></textarea>
                          </div>
                        </div>
                        <div className="card-footer bg-light">
                          <button
                            className="btn btn-info text-white w-100"
                            onClick={handleImportFromClipboard}
                            disabled={!clipboardText.trim() || loading}
                          >
                            {loading ? (
                              <>
                                <span
                                  className="spinner-border spinner-border-sm me-2"
                                  role="status"
                                  aria-hidden="true"
                                ></span>
                                กำลังนำเข้า...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-paste me-2"></i>
                                นำเข้าจาก Clipboard
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preview Table of Imported Students */}
                  {importedStudents.length > 0 ? (
                    <div className="mt-4">
                      <h6 className="mb-3">
                        <i className="fas fa-users me-2"></i>
                        รายชื่อนักเรียนที่นำเข้า ({importedStudents.length} คน)
                      </h6>
                      <div className="table-responsive">
                        <table className="table table-striped table-hover table-sm">
                          <thead className="table-light">
                            <tr>
                              <th style={{ width: "80px" }}>ลำดับ</th>
                              <th style={{ width: "150px" }}>รหัสนักศึกษา</th>
                              <th>ชื่อ-นามสกุล</th>
                              <th style={{ width: "100px" }}>การจัดการ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importedStudents.map((student, index) => (
                              <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{student.student_id}</td>
                                <td>{student.name}</td>
                                <td>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveStudent(index)}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null}

                  {/* Validation Errors */}
                  {importErrors.length > 0 && (
                    <div className="alert alert-danger mt-3">
                      <strong>พบข้อผิดพลาดในการนำเข้า:</strong>
                      <ul className="mb-0 mt-2">
                        {importErrors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Success Message */}
                  {importSuccess && (
                    <div className="alert alert-success mt-3">
                      <i className="fas fa-check-circle me-2"></i>
                      {importSuccess}
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
                  onClick={handleSaveImportedStudents}
                  disabled={importedStudents.length === 0 || loading}
                >
                  <i className="fas fa-save me-2"></i> บันทึกรายชื่อนักเรียน
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
                    <i className="fas fa-clipboardard-list fa-3x mb-3"></i>
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
                          <tr
                            key={assignment.assignment_id}
                            style={{ cursor: "pointer" }}
                            onClick={() => setSelectedAssignment(assignment)}
                          >
                            <td>{assignment.assignment_name}</td>
                            <td>{assignment.section_id}</td>
                            <td>{assignment.semester_id}</td>
                            <td>{assignment.year}</td>
                            <td>{new Date(assignment.created_at).toLocaleDateString("th-TH")}</td>
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
      </div>

      {/* Footer */}
      <footer className="mt-auto py-3 bg-light text-center">
        <div className="container">
          <span className="text-muted">Assignment Management System &copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}

export default Assignment

