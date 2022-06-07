export interface ProjectItem {
    name: string | JSX.Element;
    url?: string;
    description: string;
}

export const projectItems = [
    {
        name: "Sysbox Ubuntu Host",
        url: "https://github.com/lexermal/sysbox_ubuntu_host",
        description: "Run docker in docker totally secure and with a comfortable setup."
    },
    {
        name: "HandNote-React",
        url: "https://github.com/lexermal/HandNote-React",
        description: "Prove of concept project that uses React Native and the Microsoft Vision API."
    },
    {
        name: "HeatingPi",
        url: "https://github.com/lexermal/HeatingPi/tree/v2-dev",
        description: "Controlling a heating via webinterface or API."
    },
    {
        name: "Anki in Docker",
        url: "https://github.com/lexermal/Anki-server-in-docker",
        description: "This docker container allows to run Anki inside a docker container."
    }
] as ProjectItem[];