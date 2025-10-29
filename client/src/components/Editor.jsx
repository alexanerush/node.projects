import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "blockquote", "code-block"],
    ["clean"],
  ],
};

export default function Editor({ value, onChange }) {
  return (
    <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #cbd5e1" }}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        style={{
          minHeight: 200,
          background: "white",
          fontSize: "16px",
        }}
      />
    </div>
  );
}
