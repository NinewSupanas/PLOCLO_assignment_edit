import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const styles = {
  mainContainer: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f0f5ee',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    backgroundColor: '#ddd',
    padding: '10px',
    border: '1px solid #bbb',
  },
  td: {
    padding: '10px',
    border: '1px solid #bbb',
    textAlign: 'center',
  },
  saveButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  deleteButton: {
    marginLeft: '5px',
    padding: '8px 16px',
    backgroundColor: '#DC3545',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  updateButton: {
    marginLeft: '5px',
    padding: '8px 16px',
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
  input: {
    width: '100%',
    padding: '5px',
  },
};

function AssignmentDetail() {
  const { id } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [cloData, setCloData] = useState([]);
  const [scores, setScores] = useState({});
  const [weights, setWeights] = useState({});
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedAssignment, setUpdatedAssignment] = useState({});

  const fetchAssignmentDetails = () => {
    console.log("Fetching assignment details for ID:", id);
    axios.get(`http://localhost:8000/api/get_assignment_detail?assignment_id=${id}`)
      .then(response => {
        console.log("API Response:", response);
        if (Array.isArray(response.data) && response.data.length > 0) {
          setAssignments(response.data);
          console.log("Assignments fetched:", response.data);
        } else {
          setError('No assignment data found or invalid response format');
          console.error("Invalid response format:", response.data);
        }
      })
      .catch(error => {
        console.error("Error details:", error);
        setError(`Error fetching assignment details: ${error.message}`);
      });
  };

  useEffect(() => {
    fetchAssignmentDetails();
  }, [id]);

  useEffect(() => {
    console.log("Assignments state updated:", assignments);
    if (assignments.length > 0) {
      const courseName = assignments[0].course_name;
      console.log("Fetching CLO data for course:", courseName);
      
      axios.get(`http://localhost:8000/api/course_clo?course_name=${courseName}`)
        .then(response => {
          console.log("CLO API Response:", response.data);
          if (response.data.error) {
            setError(response.data.error);
          } else {
            setCloData(response.data);
            const initialWeights = response.data.reduce((acc, { clo_id, weight }) => ({
              ...acc,
              [clo_id]: weight || ''
            }), {});
            setWeights(initialWeights);
          }
        })
        .catch(error => {
          console.error("Error fetching CLO data:", error);
          setError('Error fetching course CLO data.');
        });
    }
  }, [assignments]);

  const handleScoreChange = (studentId, cloId, score) => {
    if (score >= 100) {
      score = 100;
    }
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [cloId]: score,
      }
    }));
  };

  const handleWeightChange = (cloId, value) => {
    if (value >= 100){
      value = 100;
    }
    setWeights(prev => ({
      ...prev,
      [cloId]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const dataToSave = [];
      for (const studentId in scores) {
        for (const cloId in scores[studentId]) {
          const score = scores[studentId][cloId];
          if (score) {
            dataToSave.push({
              student_id: studentId,
              clo_id: cloId,
              assignment_id: assignments[0].assignment_id,
              score: score,
              weight: weights[cloId],
            });
          }
        }
      }

      console.log("Data to save:", dataToSave);

      if (dataToSave.length > 0) {
        const response = await axios.post('http://localhost:8000/api/save_assignment_clo', { data: dataToSave });
        console.log("Save response:", response.data);
        alert('Data saved successfully!');
      } else {
        alert('No data entered to save.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      alert('Failed to save data: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (assignmentId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        const response = await axios.delete(`http://localhost:8000/api/delete_assignment/${assignmentId}`);
        console.log("Delete response:", response.data);
        alert('Assignment deleted successfully!');
        window.location.href = '/assignments';
      } catch (error) {
        console.error('Error deleting assignment:', error);
        alert('Failed to delete assignment: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleUpdate = async () => {
    try {
      const updatedData = {
        assignment_name: updatedAssignment.assignment_name || assignments[0].assignment_name,
        course_name: updatedAssignment.course_name || assignments[0].course_name, // แก้จาก course เป็น course_name
      };
      
      console.log("Updating assignment with data:", updatedData);
      
      const response = await axios.put(`http://localhost:8000/api/update_assignment/${id}`, updatedData);
      console.log("Update response:", response.data);
      
      alert('Assignment updated successfully!');
      setIsEditing(false);
      fetchAssignmentDetails();
    } catch (error) {
      console.error('Error updating assignment:', error.response?.data || error.message);
      alert(`Failed to update assignment: ${error.response?.data?.message || 'Unknown error'}`);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedAssignment((prev) => ({ ...prev, [name]: value }));
  };

  if (error) return (
    <div style={styles.mainContainer}>
      <h2>Error</h2>
      <p style={{color: 'red'}}>{error}</p>
      <button 
        style={styles.saveButton} 
        onClick={() => {
          setError(null);
          fetchAssignmentDetails();
        }}
      >
        Try Again
      </button>
    </div>
  );
  
  if (!assignments.length) return (
    <div style={styles.mainContainer}>
      <h2>Loading assignment details...</h2>
      <p>Please wait while we fetch the data...</p>
    </div>
  );

  const { assignment_id, assignment_name, course_name } = assignments[0];

  return (
    <div style={styles.mainContainer}>
      <h2>Assignment Details</h2>
      <div>
        <h3>Assignment {assignment_id}</h3>
        {isEditing ? (
          <>
            <label htmlFor="assignment_name">Assignment Name:</label>
            <input 
              id="assignment_name"
              style={styles.input} 
              type="text" 
              name="assignment_name" 
              value={updatedAssignment.assignment_name || assignment_name} 
              onChange={handleInputChange} 
            />
            
            <label htmlFor="course_name">Course Name:</label>
            <input 
              id="course_name"
              style={styles.input} 
              type="text" 
              name="course_name" // แก้จาก course เป็น course_name
              value={updatedAssignment.course_name || course_name} // แก้จาก course เป็น course_name
              onChange={handleInputChange} 
            />
            <div style={{marginTop: '10px'}}>
              <button style={styles.updateButton} onClick={handleUpdate}>Save Update</button>
              <button style={styles.deleteButton} onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </>
        ) : (
          <>
            <p><strong>Assignment Name:</strong> {assignment_name}</p>
            <p><strong>Course:</strong> {course_name}</p>
            <button style={styles.updateButton} onClick={() => setIsEditing(true)}>Update</button>
            <button style={styles.deleteButton} onClick={() => handleDelete(assignment_id)}>Delete</button>
          </>
        )}
      </div>

      {cloData.length > 0 ? (
        <>
          <h3 style={{marginTop: '20px'}}>Student Scores</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th} rowSpan="2">ชื่อ</th>
                {cloData.map(({ clo_id, clo_code }) => (
                  <th key={clo_id} style={styles.th}>
                    CLO <br />
                    {clo_code}<br />
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={weights[clo_id] || ''}
                      onChange={(e) => handleWeightChange(clo_id, e.target.value)}
                      placeholder="Weight"
                    />
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {assignments.map(({ student_id, name }) => {
                // ตรวจสอบว่ามี student_id และ name หรือไม่
                if (!student_id || !name) return null;
                
                return (
                  <tr key={student_id}>
                    <td style={styles.td}>{name}</td>
                    {cloData.map(({ clo_id }) => (
                      <td key={clo_id} style={styles.td}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={scores[student_id]?.[clo_id] || ''}
                          onChange={(e) => handleScoreChange(student_id, clo_id, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>

          <button style={styles.saveButton} onClick={handleSave}>Save Scores</button>
        </>
      ) : (
        <p>No CLO data available for this course.</p>
      )}
    </div>
  );
}

export default AssignmentDetail;