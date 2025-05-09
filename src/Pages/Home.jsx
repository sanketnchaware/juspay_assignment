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
  const [sprites, setSprites] = useState([
    {
      id: 0,
      rotation: 0,
      src: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
      x: 0,
      y: 0,
      motions: [],
    },
  ]);
  const [activeSpriteId, setActiveSpriteId] = useState(0);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newSprite = {
          id: Date.now(),
          src: reader.result,
          x: 0,
          y: 0,
          rotation: 0,
          motions: [],
        };
        setSprites((prev) => [...prev, newSprite]);
        setActiveSpriteId(newSprite.id);
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
    setSprites((prev) =>
      prev.map((sprite) =>
        sprite.id === activeSpriteId
          ? { ...sprite, motions: [...sprite.motions, droppedData] }
          : sprite
      )
    );
  };

  const allowDrop = (e) => e.preventDefault();

  const handlePlay = async () => {
    const playPromises = sprites.map((sprite, index) => {
      const spriteMotions = sprite.motions;

      return new Promise((resolve) => {
        const execute = async (cmds, isRepeat = false) => {
          let currentX = sprite.x;
          let currentY = sprite.y;
          let currentRotation = sprite.rotation;

          let i = 0;
          while (i < cmds.length) {
            const cmd = cmds[i];

            if (cmd.label === "Repeat") {
              // Repeat all previous motions indefinitely
              const repeatCommands = cmds.slice(0, i);
              while (true) {
                for (let r = 0; r < repeatCommands.length; r++) {
                  await new Promise((res) => setTimeout(res, 300));
                  const c = repeatCommands[r];

                  if (c.label === "Move") {
                    const distance = parseFloat(c.value);
                    const rad = (currentRotation * Math.PI) / 180;
                    currentX += distance * Math.cos(rad);
                    currentY += distance * Math.sin(rad);
                  } else if (c.label === "Turn") {
                    currentRotation += parseFloat(c.value);
                  } else if (c.label === "Go To") {
                    currentX = parseFloat(c.value.x);
                    currentY = parseFloat(c.value.y);
                  }

                  // Update sprite in-place
                  setSprites((prevSprites) => {
                    const updated = [...prevSprites];
                    updated[index] = {
                      ...updated[index],
                      x: currentX,
                      y: currentY,
                      rotation: currentRotation,
                    };
                    return updated;
                  });
                }
              }
            } else {
              await new Promise((res) => setTimeout(res, 300));
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
              }

              setSprites((prevSprites) => {
                const updated = [...prevSprites];
                updated[index] = {
                  ...updated[index],
                  x: currentX,
                  y: currentY,
                  rotation: currentRotation,
                };
                return updated;
              });
            }

            i++;
          }

          resolve(); // completes if no infinite repeat
        };

        execute(spriteMotions);
      });
    });

    await Promise.all(playPromises);
  };

  const activeSprite = sprites.find((s) => s.id === activeSpriteId);

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
      </div>

      {/* Workspace */}
      <div className="grid bg-white w-full grid-cols-2 gap-4">
        {/* Mid Area for active sprite motions */}
        <div
          className="w-full bg-yellow-100 h-full rounded border"
          onDrop={handleDrop}
          onDragOver={allowDrop}
        >
          <p className="border-b p-4">Mid Area (Active Sprite Motions)</p>
          <div className="p-4 h-full overflow-auto">
            {activeSprite?.motions.map((item, idx) => (
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
                <button
                  onClick={() => {
                    setSprites((prevSprites) =>
                      prevSprites.map((sprite) =>
                        sprite.id === activeSprite.id
                          ? {
                              ...sprite,
                              motions: sprite.motions.filter(
                                (_, i) => i !== idx
                              ),
                            }
                          : sprite
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
          <div className="p-4 flex h-full relative overflow-hidden">
            {sprites.map((sprite) => (
              <img
                src={sprite.src}
                key={sprite.id}
                alt="animated"
                className={`transition-transform duration-500 h-20 w-20 ease-in-out  cursor-pointer ${
                  sprite.id === activeSpriteId ? "ring-4 ring-blue-400" : ""
                }`}
                style={{
                  transform: `translate(${sprite.x}px, ${sprite.y}px) rotate(${sprite.rotation}deg)`,
                }}
                onClick={() => setActiveSpriteId(sprite.id)}
              />
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
              {sprites.map((sprite, index) => (
                <div
                  key={sprite.id}
                  onClick={() => setActiveSpriteId(sprite.id)}
                  className={`border p-2 cursor-pointer ${
                    sprite.id === activeSpriteId ? "bg-blue-200" : ""
                  }`}
                >
                  <img
                    src={sprite.src}
                    alt="sprite"
                    className="w-10 m-auto h-10"
                  />
                  <p>Sprite {index + 1}</p>
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
