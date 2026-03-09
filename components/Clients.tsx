import React from 'react';

const clients = [
  "Banco Popular", "Claro", "Presidente", "Banreservas", "Altice", 
  "Nestlé", "Coca Cola", "Brugal", "Grupo Ramos", "Sirena"
];

// Placeholder for logos - in production replace with <img> tags
const ClientLogo: React.FC<{ name: string }> = ({ name }) => (
  <div className="mx-8 flex items-center justify-center min-w-[150px] opacity-50 hover:opacity-100 transition-opacity duration-300 group">
    <span className="text-2xl font-black font-futuristic text-transparent bg-clip-text bg-gradient-to-b from-gray-500 to-gray-700 group-hover:from-white group-hover:to-gray-400 uppercase">
      {name}
    </span>
  </div>
);

const Clients: React.FC = () => {
  return (
    <section className="py-12 bg-black border-y border-white/5 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-black to-transparent z-10"></div>
      <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black to-transparent z-10"></div>
      
      <div className="max-w-7xl mx-auto mb-8 px-4">
        <p className="text-center text-xs font-bold tracking-[0.3em] text-gray-500 uppercase">
          Confían en nosotros
        </p>
      </div>

      <div className="flex w-[200%] animate-scroll">
        <div className="flex items-center">
          {clients.map((client, i) => (
            <ClientLogo key={i} name={client} />
          ))}
        </div>
        <div className="flex items-center">
          {clients.map((client, i) => (
            <ClientLogo key={`dup-${i}`} name={client} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Clients;