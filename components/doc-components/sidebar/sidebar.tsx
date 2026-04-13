"use client";
import SidebarLink from "@/components/doc-components/sidebar/sidebar-link";
import { useTheme } from "@/lib/ThemeContext";

type SidebarNode = {
    name: string;
    path: string;
    children?: SidebarNode[];
};

export default function Sidebar() {
    const { theme } = useTheme();

    const tree: SidebarNode[] = [
        { name: "Overview", path: "docs" },
        { name: "getting-started", path: "docs/1-getting-started" },
        {name:"about-turing-machines", path: "docs/2-about-turing-machines"},
        {name:"multi-tape-turing-machines", path: "docs/3-multi-tape-turing-machines"},
        {name:"multi-head-turing-machines", path: "docs/4-multi-head-turing-machines"},
        { name: "Efficiency", path: "docs/5-efficiency" },
    ];

    return (
        <aside style={{ width: "100%", padding: "1.4rem", height: "100vh", overflowY: "auto", background: theme === "light" ? "#ffffff" : "#0a0a0a"}}>
            <SidebarItems nodes={tree} level={0} />
        </aside>
    );
}

function SidebarItems({ nodes, level }: { nodes: SidebarNode[]; level: number }) {
    return (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {nodes.map((node) => {
                const href = node.path === "" ? "/" : `/${node.path}`;
                return (
                    <li key={node.path}>
                        <SidebarLink href={href} node={node} level={level} />
                        {node.children && (
                            <SidebarItems nodes={node.children} level={level + 1} />
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
