import { useUser } from "../../context/UserContext";

export default function ProfileDropdown() {
  const { profile, updatePincode } = useUser();

  return (
    <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-lg p-4 w-72">
      <h3 className="font-semibold">{profile.name}</h3>
      <p className="text-sm">{profile.email}</p>

      <div className="mt-4">
        <label>Pincode</label>
        <input
          className="border p-2 w-full"
          value={profile.pincode}
          onChange={(e) => updatePincode(e.target.value)}
        />
      </div>
    </div>
  );
}
