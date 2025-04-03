import React, { useState, useEffect, useRef } from 'react';
import { Link, useMatch, useResolvedPath, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import '../styles.css';

export default function Navbar({ role }) {
    const { t, i18n } = useTranslation();
    const location = useLocation(); // ใช้ location เพื่อตรวจสอบ URL ปัจจุบัน
    
    // สร้าง refs สำหรับเมนูดรอปดาวน์และ home link
    const programDropdownRef = useRef(null);
    const courseDropdownRef = useRef(null);
    const homeLinkRef = useRef(null);
    
    // เพิ่ม state และ ref สำหรับการติดตามแถบอนิเมชั่น
    const [animationStyle, setAnimationStyle] = useState({});
    const navListRef = useRef(null);
    const activeItemRef = useRef(null);
    
    // ตรวจสอบว่าเส้นทางปัจจุบันอยู่ในกลุ่มเมนูไหน
    const isProgramPath = location.pathname === '/editprogram' || location.pathname === '/editplo';
    const isCoursePath = location.pathname === '/editcourse' || location.pathname === '/editclo';
    const isHomePath = location.pathname === '/';

    // ฟังก์ชันสำหรับอัพเดทตำแหน่งของแถบอนิเมชั่น
    const updateAnimationBar = (element) => {
        if (element) {
            const width = element.offsetWidth;
            const left = element.offsetLeft;
            setAnimationStyle({
                width: `${width}px`,
                left: `${left}px`,
            });
        }
    };

    // เมื่อคอมโพเนนต์โหลดเสร็จ หรือเมื่อ location เปลี่ยน ให้ตั้งค่าแถบอนิเมชั่นตามเมนูที่ active
    useEffect(() => {
        // ถ้าอยู่ในหน้าแรก (Home) จะไม่แสดงแถบอนิเมชั่นในเมนู
        if (isHomePath) {
            // ถ้ามี home link ref ให้อัพเดทแถบอนิเมชั่น (ถ้าต้องการแสดง)
            // หรือซ่อนแถบอนิเมชั่นโดยการตั้งค่า width เป็น 0
            setAnimationStyle({
                width: '0',
                left: '0',
            });
            return;
        }
        
        // ถ้าอยู่ในเส้นทางของ Program ให้ highlight ที่เมนู Program
        if (isProgramPath && programDropdownRef.current) {
            updateAnimationBar(programDropdownRef.current);
            return;
        }
        
        // ถ้าอยู่ในเส้นทางของ Course ให้ highlight ที่เมนู Course
        if (isCoursePath && courseDropdownRef.current) {
            updateAnimationBar(courseDropdownRef.current);
            return;
        }
        
        // ในกรณีอื่นๆ ใช้ค่า activeItemRef ตามปกติ
        if (activeItemRef.current) {
            updateAnimationBar(activeItemRef.current);
        }
    }, [location.pathname, isProgramPath, isCoursePath, isHomePath]);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    // ฟังก์ชันตรวจสอบว่า URL ตรงกับเส้นทางที่กำหนดหรือไม่
    const isPathActive = (path) => {
        return location.pathname === path;
    };

    return (
        <nav className="nav">
            <div className="nav-left">
                <Link 
                    to="/" 
                    className="site-title"
                    ref={homeLinkRef}
                    style={{ color: isHomePath ? '#FF8C00' : '#000000' }}
                    onClick={() => {
                        // เมื่อคลิกที่ PLOCLO ให้ซ่อนแถบอนิเมชั่น
                        setAnimationStyle({
                            width: '0',
                            left: '0',
                        });
                    }}
                >PLOCLO</Link>
            </div>
            <div className="nav-right">
                <ul className="nav-list" ref={navListRef}>
                    
                    <CustomLink 
                        to="/ViewCourseInfo" 
                        onMouseEnter={(e) => updateAnimationBar(e.currentTarget)}
                        onMouseLeave={() => activeItemRef.current && updateAnimationBar(activeItemRef.current)}
                        setActiveRef={activeItemRef}
                    >
                        {t('CourseInfo')}
                    </CustomLink>
                    
                    {(role === "Student" || role === "Instructor" || role === "Curriculum Admin") && (
                        <CustomLink 
                            to="/ViewChart" 
                            onMouseEnter={(e) => updateAnimationBar(e.currentTarget)}
                            onMouseLeave={() => activeItemRef.current && updateAnimationBar(activeItemRef.current)}
                            setActiveRef={activeItemRef}
                        >
                            {t('ViewChart')}
                        </CustomLink>
                    )}
                    
                    {(role === "Curriculum Admin" ) && (
                        <CustomLink 
                            to="/Assigment" 
                            onMouseEnter={(e) => updateAnimationBar(e.currentTarget)}
                            onMouseLeave={() => activeItemRef.current && updateAnimationBar(activeItemRef.current)}
                            setActiveRef={activeItemRef}
                        >
                            {t('Assigment')}
                        </CustomLink>
                    )}

                    {/* Program Dropdown for Curriculum Admin */}
                    {role === "Curriculum Admin" && (
                        <li 
                            className={`nav-item ${isProgramPath ? 'active' : ''}`} 
                            ref={programDropdownRef}
                            onMouseEnter={(e) => updateAnimationBar(e.currentTarget)}
                            onMouseLeave={() => {
                                // ถ้าอยู่ในเส้นทาง Program ให้ค้าง animation ไว้ที่ dropdown นี้
                                if (isProgramPath) {
                                    updateAnimationBar(programDropdownRef.current);
                                } else if (activeItemRef.current) {
                                    updateAnimationBar(activeItemRef.current);
                                }
                            }}
                        >
                            <span
                                className="dropdown-toggle"
                                style={{cursor: 'pointer'}}
                            >
                                {t('Program')}
                            </span>
                            <ul className="dropdown-menu d-grid gap-0">
                                <li>
                                    <Link 
                                        to="/editprogram" 
                                        className={isPathActive('/editprogram') ? 'active' : ''}
                                        style={{ color: isPathActive('/editprogram') ? '#FF8C00' : '#000000' }}
                                    >
                                        {t('Edit Program')}
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/editplo" 
                                        className={isPathActive('/editplo') ? 'active' : ''}
                                        style={{ color: isPathActive('/editplo') ? '#FF8C00' : '#000000' }}
                                    >
                                        {t('Edit PLO')}
                                    </Link>
                                </li>
                            </ul>
                        </li>
                    )}

                    {/* Course Dropdown for System Admin and Curriculum Admin */}
                    {(role === "System Admin" || role === "Curriculum Admin") && (
                        <li 
                            className={`nav-item ${isCoursePath ? 'active' : ''}`}
                            ref={courseDropdownRef}
                            onMouseEnter={(e) => updateAnimationBar(e.currentTarget)}
                            onMouseLeave={() => {
                                // ถ้าอยู่ในเส้นทาง Course ให้ค้าง animation ไว้ที่ dropdown นี้
                                if (isCoursePath) {
                                    updateAnimationBar(courseDropdownRef.current);
                                } else if (activeItemRef.current) {
                                    updateAnimationBar(activeItemRef.current);
                                }
                            }}
                        >
                            <span
                                className="dropdown-toggle"
                                style={{cursor: 'pointer'}}
                            >
                                {t('Course')}
                            </span>
                            <ul className="dropdown-menu d-grid gap-0">
                                <li>
                                    <Link 
                                        to="/editcourse" 
                                        className={isPathActive('/editcourse') ? 'active' : ''}
                                        style={{ color: isPathActive('/editcourse') ? '#FF8C00' : '#000000' }}
                                    >
                                        {t('Edit Course')}
                                    </Link>
                                </li>
                                <li>
                                    <Link 
                                        to="/editclo" 
                                        className={isPathActive('/editclo') ? 'active' : ''}
                                        style={{ color: isPathActive('/editclo') ? '#FF8C00' : '#000000' }}
                                    >
                                        {t('Edit CLO')}
                                    </Link>
                                </li>
                            </ul>
                        </li>
                    )}

                    <CustomLink 
                        to="/aboutData" 
                        onMouseEnter={(e) => updateAnimationBar(e.currentTarget)}
                        onMouseLeave={() => activeItemRef.current && updateAnimationBar(activeItemRef.current)}
                        setActiveRef={activeItemRef}
                    >
                        {t('About')}
                    </CustomLink>
                    
                    {/* แถบอนิเมชั่น */}
                    <div className="animation-bar" style={animationStyle}></div>
                </ul>
                
                <div className="language-selector">
                    <span className="language-label">
                        {t('Select Language')}:
                    </span>
                    <ul className="language-menu d-grid gap-0">
                        <li onClick={() => changeLanguage('en')}>English</li>
                        <li onClick={() => changeLanguage('ch')}>Chinese</li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

function CustomLink({ to, children, onMouseEnter, onMouseLeave, setActiveRef, ...props }) {
    const resolvedPath = useResolvedPath(to);
    const isActive = useMatch({ path: resolvedPath.pathname, end: true });
    const linkRef = useRef(null);
    const location = useLocation();

    // ตรวจสอบว่า URL ปัจจุบันอยู่ในเส้นทางของเมนูดรอปดาวน์หรือไม่
    const isProgramPath = location.pathname === '/editprogram' || location.pathname === '/editplo';
    const isCoursePath = location.pathname === '/editcourse' || location.pathname === '/editclo';

    // ถ้าลิงค์นี้ active และไม่ได้อยู่ในดรอปดาวน์เมนู ให้เก็บ ref ไว้ใน parent component
    useEffect(() => {
        // ถ้าอยู่ในเส้นทางของเมนูดรอปดาวน์ จะไม่อัพเดต activeItemRef
        if (isProgramPath || isCoursePath) {
            return;
        }
        
        if (isActive && linkRef.current && setActiveRef) {
            setActiveRef.current = linkRef.current;
        }
    }, [isActive, setActiveRef, location.pathname, isProgramPath, isCoursePath]);

    return (
        <li 
            className={isActive ? "active" : ""} 
            ref={linkRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Link to={to} {...props}>{children}</Link>
        </li>
    );
}