function EntrySelection(props: { currentFolder: string; entries: string[] }) {
  return (
    <div>
      <h1>Current area: {props.currentFolder}</h1>
      {props.entries
        .map((e) => e.replace(".md", ""))
        .map((e) => (
          <a key={e} href={`/blog/${props.currentFolder}/${toURL(e)}`}>
            <p>{e}</p>
          </a>
        ))}
    </div>
  );
}

function toURL(title: string) {
  return title.replaceAll(" ", "-");
}

export default EntrySelection;
