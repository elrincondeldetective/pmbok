// frontend/src/components/common/FloatingNav.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FaPlayCircle, FaTh, FaBook, FaProjectDiagram } from 'react-icons/fa';

// Definimos las secciones con sus íconos correspondientes
const sections = [
    { id: 'control-panel', title: 'Panel de Control', icon: <FaPlayCircle /> },
    { id: 'kanban-board', title: 'Tablero Kanban', icon: <FaTh /> },
    { id: 'scrum-guide', title: 'Guía Scrum', icon: <FaBook /> },
    { id: 'pmbok-guide', title: 'Guía PMBOK', icon: <FaProjectDiagram /> },
];

const FloatingNav: React.FC = () => {
    const [activeSection, setActiveSection] = useState<string | null>(sections[0]?.id || null);
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            {
                rootMargin: '-40% 0px -60% 0px',
                threshold: 0
            }
        );

        sections.forEach(section => {
            const element = document.getElementById(section.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            sections.forEach(section => {
                const element = document.getElementById(section.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const navHeight = 64; // Altura aproximada de tu DashboardNav
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.scrollY - navHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    return (
        <nav
            ref={navRef}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center bg-white/50 backdrop-blur-md rounded-full shadow-lg p-2 space-y-2 border border-gray-200"
        >
            {sections.map(section => (
                <div key={section.id} className="group relative">
                    <a
                        href={`#${section.id}`}
                        onClick={(e) => {
                            e.preventDefault();
                            // 👇 INICIO DE LA CORRECCIÓN: Actualiza el estado activo inmediatamente al hacer clic
                            setActiveSection(section.id);
                            // 👆 FIN DE LA CORRECCIÓN
                            scrollToSection(section.id);
                        }}
                        className={`
                            flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                            ${activeSection === section.id
                                ? 'bg-gray-800 text-white shadow-md scale-110'
                                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-800'
                            }
                        `}
                        aria-label={section.title}
                    >
                        {section.icon}
                    </a>
                    <span
                        className={`
                            absolute left-full ml-4 px-3 py-1 bg-gray-800 text-white text-xs font-bold
                            rounded-md shadow-lg opacity-0 pointer-events-none transition-all duration-300
                            group-hover:opacity-100 group-hover:translate-x-2 whitespace-nowrap
                        `}
                    >
                        {section.title}
                    </span>
                </div>
            ))}
        </nav>
    );
};

export default FloatingNav;
