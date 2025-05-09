import { PlayIcon, PlusCircle } from "lucide-react";
import React, { useState } from "react";

const Home = () => {
  const initialMotions = [
    { label: "Move", value: "10", suffix: "steps" },
    { label: "Turn", value: "90", suffix: "degrees" },
    {
      label: "Go To",
      value: { x: "100", y: "200" },
    },
    { label: "Repeat" },
  ];

  const [motions, setMotions] = useState(initialMotions);
  const [midAreaItems, setMidAreaItems] = useState([]);
  const [imageSrc, setImageSrc] = useState(null);

  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [rotation, setRotation] = useState(0);

  const handlePlay = async (midAreaItems) => {
    let currentX = x;
    let currentY = y;
    let currentRotation = rotation;

    const execute = async (cmds) => {
      for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];

        await new Promise((res) => setTimeout(res, 300));

        if (cmd.label === "Move") {
          const distance = parseFloat(cmd.value);
          const rad = (currentRotation * Math.PI) / 180;
          currentX += distance * Math.cos(rad);
          currentY += distance * Math.sin(rad);
          setX(currentX);
          setY(currentY);
        } else if (cmd.label === "Turn") {
          currentRotation += parseFloat(cmd.value);
          setRotation(currentRotation);
        } else if (cmd.label === "Go To") {
          currentX = parseFloat(cmd.value.x);
          currentY = parseFloat(cmd.value.y);
          setX(currentX);
          setY(currentY);
        } else if (cmd.label === "Repeat") {
          const prevCommands = cmds.slice(0, i);
          while (true) {
            for (let j = 0; j < prevCommands.length; j++) {
              await execute([prevCommands[j]]);
            }
          }
        }
      }
    };

    await execute(midAreaItems);
  };

  const handleInputChange = (index, newValue) => {
    const updated = [...motions];
    updated[index].value = newValue;
    setMotions(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedData = JSON.parse(e.dataTransfer.getData("motion"));
    setMidAreaItems((prev) => [...prev, droppedData]);
  };

  const allowDrop = (e) => e.preventDefault();

  return (
    <div className="flex bg-slate-200 p-4 gap-4 w-full h-screen">
      {/* motions and actions    */}
      <div className="bg-blue-100 border w-4/12">
        <p className="border-b p-4">Actions</p>
        <div className="p-4">
          <p>Motions</p>
          {motions.map((motion, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("motion", JSON.stringify(motion))
              }
              className="flex items-center bg-blue-200 p-2 my-2 rounded-md cursor-move space-x-2"
            >
              <span>{motion.label}</span>

              {motion.label === "Go To" ? (
                <>
                  <span>x:</span>
                  <input
                    type="text"
                    value={motion.value.x}
                    onChange={(e) => {
                      const updated = [...motions];
                      updated[index].value.x = e.target.value;
                      setMotions(updated);
                    }}
                    className="w-12 px-1 text-center bg-white border border-gray-300 rounded"
                  />
                  <span>y:</span>
                  <input
                    type="text"
                    value={motion.value.y}
                    onChange={(e) => {
                      const updated = [...motions];
                      updated[index].value.y = e.target.value;
                      setMotions(updated);
                    }}
                    className="w-12 px-1 text-center bg-white border border-gray-300 rounded"
                  />
                </>
              ) : motion.label === "Repeat" ? null : (
                <>
                  <input
                    type="text"
                    value={motion.value}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    className="w-20 px-1 text-center bg-white border border-gray-300 rounded"
                  />
                  {motion.suffix && <span>{motion.suffix}</span>}
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid bg-white w-full grid-cols-2 gap-4">
        {/* mid area */}
        <div
          className="w-full bg-yellow-100 h-full rounded border"
          onDrop={handleDrop}
          onDragOver={allowDrop}
        >
          <p className="border-b p-4">Mid Area</p>
          <div className="p-4 h-full overflow-auto">
            {midAreaItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center bg-yellow-300 p-2 my-2 rounded space-x-2"
              >
                <span>{item.label}</span>

                {item.label === "Go To" ? (
                  <>
                    <span>x:</span>
                    <input
                      type="text"
                      value={item.value.x}
                      readOnly
                      className="w-12 px-1 text-center bg-white border border-gray-300 rounded"
                    />
                    <span>y:</span>
                    <input
                      type="text"
                      value={item.value.y}
                      readOnly
                      className="w-12 px-1 text-center bg-white border border-gray-300 rounded"
                    />
                  </>
                ) : item.label === "Repeat" ? null : (
                  <>
                    <input
                      type="text"
                      value={item.value}
                      readOnly
                      className="w-20 px-1 text-center bg-white border border-gray-300 rounded"
                    />
                    {item.suffix && <span>{item.suffix}</span>}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* playground */}
        <div className="border flex overflow-hidden flex-col">
          <p className="border-b p-4">Playground</p>
          <div className="p-4 h-full relative overflow-hidden">
            {imageSrc && (
              <img
                src={imageSrc}
                alt="animated"
                className="absolute transition-transform duration-500 ease-in-out"
                style={{
                  transform: `translate(${x}px, ${y}px) rotate(${rotation}deg)`,
                  width: "100px",
                }}
              />
            )}
          </div>
          <div className="p-4 flex items-center justify-between gap-4 border-t">
            <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <PlusCircle />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImageSrc(reader.result);
                      setX(0);
                      setY(0);
                      setRotation(0);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="hidden"
              />
            </label>
            <button
              onClick={() => handlePlay(midAreaItems)}
              className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-200 cursor-pointer active:bg-blue-300 active:scale-95"
            >
              <PlayIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
