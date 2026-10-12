import React from 'react';

export const sourceExamples = [
  { label: 'Counter', source: 'pragma solidity ^0.8.24;\ncontract Counter { uint256 public count; function increment() external { count += 1; } }', standard: 'ERC20' },
  { label: 'Owned vault', source: 'pragma solidity ^0.8.24;\ncontract OwnedVault { address public owner; mapping(address => uint256) public balance; constructor() { owner = msg.sender; } function deposit() external payable { balance[msg.sender] += msg.value; } function withdraw(uint256 amount) external { require(balance[msg.sender] >= amount); balance[msg.sender] -= amount; payable(msg.sender).transfer(amount); } }', standard: 'ERC721' },
  { label: 'Token transfer', source: 'pragma solidity ^0.8.24;\ncontract ExampleToken { mapping(address => uint256) public balanceOf; function transfer(address to, uint256 amount) external returns (bool) { require(balanceOf[msg.sender] >= amount); balanceOf[msg.sender] -= amount; balanceOf[to] += amount; return true; } }', standard: 'ERC20' },
];

export default function NativeSourcePresets({ onFill, disabled = false }: { onFill: (index: number) => void; disabled?: boolean }) {
  return <div className="flex flex-wrap gap-2 mb-4" aria-label="Source examples">{sourceExamples.map((example, index) =>
    <button key={example.label} type="button" disabled={disabled} onClick={() => onFill(index)} className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800 disabled:opacity-50">Fill: {example.label}</button>
  )}<p className="w-full text-xs text-gray-500">Examples are fictional and undeployed. A selected saved contract and its source are preserved.</p></div>;
}
