// components/RoomThemes.tsx
import React, { useState } from 'react';
import styled from 'styled-components';

const themes = [
  { id: 'modern', name: 'Modern', img: '/images/modern.jpg' },
  { id: 'summer', name: 'Summer', img: '/images/summer.jpg' },
  { id: 'professional', name: 'Professional', img: '/images/professional.jpg' },
  { id: 'tropical', name: 'Tropical', img: '/images/tropical.jpg' },
  { id: 'coastal', name: 'Coastal', img: '/images/coastal.jpg' },
  { id: 'vintage', name: 'Vintage', img: '/images/vintage.jpg' },
];

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
`;
const Label = styled.label`
  margin: 10px;
  cursor: pointer;
  position: relative;
`;

const Input = styled.input`
  display: none;
  &:checked + div {
    border: 2px solid pink;
  }
  &:checked + div::after {
    content: '✔';
    color: #fff;
    background-color: pink;
    border-radius: 50%;
    width: 25px;
    height: 25px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 5px;
    right: 5px;
  }
`;

const Box = styled.div<{ $img: string }>`
  width: 100px;
  height: 100px;
  border: 2px solid transparent;
  border-radius: 10px;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
  transition: border 0.3s;
  background-image: url(${props => props.$img});
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Text = styled.div`
  background-color: rgba(255, 255, 255, 0.7);
  padding: 5px;
  border-radius: 5px;
  font-weight: bold;
`;

const RoomThemes = () => {
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedThemes((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      } else if (prev.length < 4) {
        return [...prev, value];
      }
      return prev;
    });
  };

  return (
    <Container>
      {themes.map((theme) => (
        <Label key={theme.id}>
          <Input
            type="checkbox"
            value={theme.id}
            onChange={handleChange}
            checked={selectedThemes.includes(theme.id)}
          />
          <Box $img={theme.img}>
            <Text>{theme.name}</Text>
          </Box>
        </Label>
      ))}
    </Container>
  );
};

export default RoomThemes;
