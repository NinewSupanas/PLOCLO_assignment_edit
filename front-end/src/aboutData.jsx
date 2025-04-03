import React, { useEffect, useRef, useState } from "react";
import TeamData from "./assets/TeamData.js";
import "./aboutDataStyle.css";

function AboutData() {
    // สถานะสำหรับติดตามว่าส่วนไหนกำลังแสดงผล
    const [activeSection, setActiveSection] = useState("version1");
    const containerRef = useRef(null);
    
    // useEffect สำหรับตั้งค่าส่วนเริ่มต้น (หากอยู่ที่ advisor)
    useEffect(() => {
        // ตรวจสอบ URL hash เพื่อหาว่าควรเริ่มที่ส่วนไหน
        const hash = window.location.hash;
        if (hash === "#advisor") {
            setActiveSection("advisor");
            // เลื่อนไปยังส่วน advisor อัตโนมัติ
            setTimeout(() => {
                if (containerRef.current) {
                    const advisorSection = document.getElementById("advisor");
                    if (advisorSection) {
                        containerRef.current.scrollTo({
                            top: advisorSection.offsetTop,
                            behavior: 'auto'
                        });
                    }
                }
            }, 100);
        }
    }, []);

    // ติดตามการเลื่อนหน้าเพื่ออัปเดตปุ่มนำทาง
    useEffect(() => {
        if (!containerRef.current) return;
        
        // ฟังก์ชันสำหรับตรวจสอบว่ากำลังแสดงส่วนไหน
        const handleScroll = () => {
            if (!containerRef.current) return;
            
            const sections = document.querySelectorAll('.snap-section');
            const container = containerRef.current;
            const scrollPosition = container.scrollTop;
            
            // คำนวณว่าอยู่ที่ส่วนไหนโดยหา section ที่อยู่ในมุมมอง
            let newActiveSection = activeSection;
            
            sections.forEach((section) => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                // ถ้าส่วนใหญ่ของ section อยู่ในมุมมอง
                if (scrollPosition >= sectionTop - 100 && 
                    scrollPosition < sectionTop + sectionHeight - 100) {
                    newActiveSection = section.id;
                }
            });
            
            // อัปเดตสถานะเฉพาะเมื่อเปลี่ยนแปลง
            if (newActiveSection !== activeSection) {
                setActiveSection(newActiveSection);
                
                // ส่งข้อมูลการเปลี่ยนแปลงส่วนไปยัง console เพื่อดีบัก
                console.log("Active section changed to:", newActiveSection);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            
            // เรียกครั้งแรกเพื่อตั้งค่าเริ่มต้น
            setTimeout(handleScroll, 200);
            
            return () => {
                container.removeEventListener('scroll', handleScroll);
            };
        }
    }, [activeSection]);

    // ฟังก์ชันสำหรับนำทางไปยังส่วนต่างๆ
    const scrollToSection = (id) => {
        if (!containerRef.current) return;
        
        setActiveSection(id); // เปลี่ยนสถานะทันที
        
        const container = containerRef.current;
        const element = document.getElementById(id);
        
        if (element) {
            const offsetTop = element.offsetTop;
            container.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    };

    return (
        <>
            {/* หัวข้อ ABOUT ที่อยู่ใต้ navbar */}
            <div className="about-title-container">
                <h1 className="about-title">ABOUT</h1>
            </div>
            
            <div className="snap-container" ref={containerRef}>
                {/* ปุ่มนำทาง */}
                <div className="scroll-nav">
                    <a 
                        href="#version1" 
                        className={activeSection === "version1" ? "active" : ""}
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToSection("version1");
                        }}
                        title="Version 1"
                    ></a>
                    <a 
                        href="#version2" 
                        className={activeSection === "version2" ? "active" : ""}
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToSection("version2");
                        }}
                        title="Version 2"
                    ></a>
                    <a 
                        href="#advisor" 
                        className={activeSection === "advisor" ? "active" : ""}
                        onClick={(e) => {
                            e.preventDefault();
                            scrollToSection("advisor");
                        }}
                        title="Advisor"
                    ></a>
                </div>
                
                {/* Version 1 */}
                <section id="version1" className="snap-section">
                    <div className="version-section">
                        <div className="version-label">VERSION 1</div>
                        
                        {/* กรอบสีขาวใหญ่ครอบทั้งหมด */}
                        <div className="white-box">
                            <div className="row justify-content-center">
                                {TeamData.slice(0, 2).map((member, index) => (
                                    <div key={index} className="col-md-5 mb-3">
                                        <div className="text-center">
                                            <div className="circle-image" style={{
                                                width: "150px",
                                                height: "150px"
                                            }}>
                                                <img 
                                                    src={member.image} 
                                                    alt={member.name_th} 
                                                    className="img-fluid"
                                                    style={{ 
                                                        width: "100%", 
                                                        height: "100%", 
                                                        objectFit: "cover" 
                                                    }}
                                                />
                                            </div>
                                            <h3 className="name-thai">
                                                {member.name_th}
                                            </h3>
                                            <p className="name-eng">
                                                {member.name_eng}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Version 2 */}
                <section id="version2" className="snap-section">
                    <div className="version-section version2-container">
                        <div className="version-label">VERSION 2</div>
                        
                        {/* กรอบสีขาวใหญ่ครอบทั้งหมด */}
                        <div className="white-box">
                            <div className="row justify-content-around">
                                {TeamData.slice(2, 5).map((member, index) => (
                                    <div key={index} className="col-md-3 member-card">
                                        <div className="text-center">
                                            <div className="circle-image" style={{
                                                width: "120px",
                                                height: "120px"
                                            }}>
                                                <img 
                                                    src={member.image} 
                                                    alt={member.name_th} 
                                                    className="img-fluid"
                                                    style={{ 
                                                        width: "100%", 
                                                        height: "100%", 
                                                        objectFit: "cover" 
                                                    }}
                                                />
                                            </div>
                                            <h3 className="name-thai">
                                                {member.name_th}
                                            </h3>
                                            <p className="name-eng">
                                                {member.name_eng}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* Advisor */}
                <section id="advisor" className="snap-section">
                    <div className="version-section">
                        <div className="version-label">ADVISOR</div>
                        
                        {/* กรอบสีขาวใหญ่ครอบทั้งหมด */}
                        <div className="white-box">
                            <div className="advisor-container">
                                {TeamData.slice(5, 7).map((member, index) => (
                                    <div key={index} className="advisor-item">
                                        <div className="text-center">
                                            <div className="circle-image" style={{
                                                width: "140px",
                                                height: "140px"
                                            }}>
                                                <img 
                                                    src={member.image} 
                                                    alt={member.name_th} 
                                                    className="img-fluid"
                                                    style={{ 
                                                        width: "100%", 
                                                        height: "100%", 
                                                        objectFit: "cover" 
                                                    }}
                                                />
                                            </div>
                                            <h3 className="name-thai">
                                                {member.name_th}
                                            </h3>
                                            <p className="name-eng">
                                                {member.name_eng}
                                            </p>
                                            <span className="advisor-badge">
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}

export default AboutData;