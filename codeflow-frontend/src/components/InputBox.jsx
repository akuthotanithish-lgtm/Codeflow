const InputBox = ({ value, onChange, placeholder = "Enter your input here..." }) => {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full h-full p-4 bg-secondary text-gray-200 border border-gray-600 rounded-md focus:ring-accent focus:border-accent resize-none font-mono"
        />
    );
};

export default InputBox;