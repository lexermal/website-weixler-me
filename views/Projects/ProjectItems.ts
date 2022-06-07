export interface ProjectItem {
    name: string | JSX.Element;
    url?: string;
    description: string;
}

export const projectItems = [
    {
        name: "Sysbox Ubuntu Host",
        url: "https://github.com/lexermal/sysbox_ubuntu_host",
        description: "Securely running Docker inside a Docker container in a comfortable way."
    },
    {
        name: "HandNote-React",
        url: "https://github.com/lexermal/HandNote-React",
        description: "Proof of concept project that uses React Native and the Microsoft Vision API."
    },
    {
        name: "HeatingPi",
        url: "https://github.com/lexermal/HeatingPi/tree/v2-dev",
        description: "Controlling a heating via web interface or API."
    },
    {
        name: "Anki in Docker",
        url: "https://github.com/lexermal/Anki-server-in-docker",
        description: "Docker container to run the Anki-sync-server."
    }
] as ProjectItem[];