import { PlayIcon, PlusCircle } from "lucide-react";
import React, { useState } from "react";

const Home = () => {
  const initialMotions = [
    { label: "Move", value: "10", suffix: "steps" },
    { label: "Turn", value: "90", suffix: "degrees" },
    { label: "Go To", value: { x: "100", y: "200" } },
    { label: "Repeat" },
  ];

  const [motions, setMotions] = useState(initialMotions);

  const [looks, setLooks] = useState([
    { label: "Say", value: "", duration: "", type: "say" },
    { label: "Think", value: "", duration: "", type: "think" },
  ]);

  const [spirits, setspirits] = useState([
    {
      id: 0,
      rotation: 0,
      src: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      x: 0,
      y: 0,
      motions: [],
      visibleText: "", // for say/think display
    },
  ]);
  const [activespiritId, setActivespiritId] = useState(0);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newspirit = {
          id: Date.now(),
          src: reader.result,
          x: 0,
          y: 0,
          rotation: 0,
          motions: [],
          visibleText: "",
        };
        setspirits((prev) => [...prev, newspirit]);
        setActivespiritId(newspirit.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (index, newValue) => {
    const updated = [...motions];
    updated[index].value = newValue;
    setMotions(updated);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedData = JSON.parse(e.dataTransfer.getData("motion"));
    setspirits((prev) =>
      prev.map((spirit) =>
        spirit.id === activespiritId
          ? { ...spirit, motions: [...spirit.motions, droppedData] }
          : spirit
      )
    );
  };

  const allowDrop = (e) => e.preventDefault();

  const handlePlay = async () => {
    let collisionMap = new Set();

    const detectCollision = (a, b) => {
      const ax = a.x,
        ay = a.y;
      const bx = b.x,
        by = b.y;
      const distance = Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
      return distance < 60; // assuming sprite size ~50, add buffer
    };

    const swapMotions = (id1, id2) => {
      setspirits((prev) => {
        const copy = [...prev];
        const idx1 = copy.findIndex((s) => s.id === id1);
        const idx2 = copy.findIndex((s) => s.id === id2);

        if (idx1 !== -1 && idx2 !== -1) {
          const temp = copy[idx1].motions;
          copy[idx1].motions = copy[idx2].motions;
          copy[idx2].motions = temp;
        }

        return copy;
      });
    };

    const playCharacter = (spirit, index) => {
      return new Promise(async (resolve) => {
        let currentX = spirit.x;
        let currentY = spirit.y;
        let currentRotation = spirit.rotation;
        const motions = [...spirit.motions];

        const executeMotion = async (cmd) => {
          if (cmd.label === "Move") {
            const distance = parseFloat(cmd.value);
            const rad = (currentRotation * Math.PI) / 180;
            currentX += distance * Math.cos(rad);
            currentY += distance * Math.sin(rad);
          } else if (cmd.label === "Turn") {
            currentRotation += parseFloat(cmd.value);
          } else if (cmd.label === "Go To") {
            currentX = parseFloat(cmd.value.x);
            currentY = parseFloat(cmd.value.y);
          } else if (cmd.label === "Say" || cmd.label === "Think") {
            const message = cmd.value;
            const duration = parseFloat(cmd.duration) * 1000;
            setspirits((prev) => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                visibleText: message,
              };
              return updated;
            });
            await new Promise((res) => setTimeout(res, duration));
            setspirits((prev) => {
              const updated = [...prev];
              updated[index] = {
                ...updated[index],
                visibleText: "",
              };
              return updated;
            });
            return;
          }

          setspirits((prev) => {
            const updated = [...prev];
            updated[index] = {
              ...updated[index],
              x: currentX,
              y: currentY,
              rotation: currentRotation,
            };
            return updated;
          });

          await new Promise((res) => setTimeout(res, 200));
        };

        const runLoop = async () => {
          while (true) {
            for (const cmd of motions) {
              await executeMotion(cmd);
            }

            // Collision check (after 1 cycle of motions)
            setspirits((currentSpirits) => {
              const newSpirits = [...currentSpirits];
              const currentSpirit = newSpirits[index];

              newSpirits.forEach((otherSpirit, i) => {
                if (
                  i !== index &&
                  detectCollision(currentSpirit, otherSpirit)
                ) {
                  const key = [currentSpirit.id, otherSpirit.id]
                    .sort()
                    .join("-");
                  if (!collisionMap.has(key)) {
                    collisionMap.add(key);
                    swapMotions(currentSpirit.id, otherSpirit.id);
                  }
                }
              });

              return newSpirits;
            });

            await new Promise((res) => setTimeout(res, 200));
          }
        };

        runLoop();
      });
    };

    const promises = spirits.map((spirit, index) =>
      playCharacter(spirit, index)
    );
    await Promise.all(promises);
  };

  const activespirit = spirits.find((s) => s.id === activespiritId);

  return (
    <div className="flex bg-slate-200 p-4 gap-4 w-full h-screen">
      {/* Actions */}
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

        <p className="border-b border-t p-4">Looks</p>
        <div className="p-4">
          {looks.map((look, idx) => (
            <div
              key={`look-${idx}`}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("motion", JSON.stringify(look))
              }
              className="flex items-center bg-purple-200 p-2 my-2 rounded-md cursor-move space-x-2"
            >
              <span>{look.label}</span>
              <input
                type="text"
                placeholder="Message"
                value={look.value}
                onChange={(e) => {
                  const updated = [...looks];
                  updated[idx].value = e.target.value;
                  setLooks(updated);
                }}
                className="w-24 px-1 text-center bg-white border border-gray-300 rounded"
              />
              <span>for</span>
              <input
                type="text"
                placeholder="Seconds"
                value={look.duration}
                onChange={(e) => {
                  const updated = [...looks];
                  updated[idx].duration = e.target.value;
                  setLooks(updated);
                }}
                className="w-12 px-1 text-center bg-white border border-gray-300 rounded"
              />
              <span>sec</span>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace */}
      <div className="grid bg-white w-full grid-cols-2 gap-4">
        {/* Mid Area for active spirit motions */}
        <div
          className="w-full bg-yellow-100 h-full rounded border"
          onDrop={handleDrop}
          onDragOver={allowDrop}
        >
          <p className="border-b p-4">Mid Area (Active spirit Motions)</p>
          <div className="p-4 h-full overflow-auto">
            {activespirit?.motions.map((item, idx) => (
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
                ) : item.label === "Repeat" ? null : item.label === "Say" ||
                  item.label === "Think" ? (
                  <>
                    <input
                      type="text"
                      value={item.value}
                      readOnly
                      className="w-24 px-1 text-center bg-white border border-gray-300 rounded"
                    />
                    <span>for</span>
                    <input
                      type="text"
                      value={item.duration}
                      readOnly
                      className="w-12 px-1 text-center bg-white border border-gray-300 rounded"
                    />
                    <span>sec</span>
                  </>
                ) : (
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
                <button
                  onClick={() => {
                    setspirits((prevspirits) =>
                      prevspirits.map((spirit) =>
                        spirit.id === activespirit.id
                          ? {
                              ...spirit,
                              motions: spirit.motions.filter(
                                (_, i) => i !== idx
                              ),
                            }
                          : spirit
                      )
                    );
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Playground */}
        <div className="border flex overflow-hidden flex-col">
          <p className="border-b p-4">Playground</p>
          <div className="p-4 debug gap-4  flex h-full relative overflow-hidden">
            {spirits.map((spirit) => (
              <div
                key={spirit.id}
                className=""
                style={{
                  transform: `translate(${spirit.x}px, ${spirit.y}px) rotate(${spirit.rotation}deg)`,
                  transition: "transform 0.5s ease-in-out",
                }}
                onClick={() => setActivespiritId(spirit.id)}
              >
                <img
                  src={spirit.src}
                  alt="animated"
                  className={`h-20 w-20 cursor-pointer ${
                    spirit.id === activespiritId ? "ring-4 ring-blue-400" : ""
                  }`}
                />
                {spirit.visibleText && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white text-black border px-2 py-1 rounded shadow-md text-xs">
                    {spirit.visibleText}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Controls */}
          <div className="p-4 flex items-center justify-between gap-4 border-t">
            <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              <PlusCircle />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            <div className="flex justify-center items-center gap-2">
              {spirits.map((spirit, index) => (
                <div
                  key={spirit.id}
                  onClick={() => setActivespiritId(spirit.id)}
                  className={`border p-2 cursor-pointer ${
                    spirit.id === activespiritId ? "bg-blue-200" : ""
                  }`}
                >
                  <img
                    src={spirit.src}
                    alt="spirit"
                    className="w-10 m-auto h-10"
                  />
                  <p>spirit {index + 1}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handlePlay}
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
