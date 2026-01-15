'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Search,
  Phone,
  MessageSquare,
  X,
} from 'lucide-react'
import { useSession } from '@/components/providers/SessionProvider'

interface GroupMember {
  id: string
  member_type: string
  phone_number: string | null
  name: string | null
  student_id: string | null
  user_id: string | null
  added_at: string
}

interface Student {
  id: string
  first_name: string
  last_name: string
  admission_number: string
  phone: string | null
  parent_phone?: string | null
  current_class?: { name: string } | null
}

interface Group {
  id: string
  name: string
  group_type: string
  description: string | null
  member_count: number
  is_active: boolean
}

export default function GroupDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useSession()
  const groupId = params.id as string

  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [addingMembers, setAddingMembers] = useState(false)
  const [customPhone, setCustomPhone] = useState('')
  const [customName, setCustomName] = useState('')
  const [addType, setAddType] = useState<'students' | 'custom'>('students')

  const fetchGroup = useCallback(async () => {
    try {
      const response = await fetch(`/api/whatsapp/groups/${groupId}`)
      if (response.ok) {
        const data = await response.json()
        setGroup(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch group:', error)
    }
  }, [groupId])

  const fetchMembers = useCallback(async () => {
    try {
      const response = await fetch(`/api/whatsapp/groups/${groupId}/members`)
      const data = await response.json()
      console.log('[GroupDetail] Members API response:', data)
      if (response.ok) {
        setMembers(data.data || [])
      } else {
        console.error('[GroupDetail] Members API error:', data.error)
      }
    } catch (error) {
      console.error('Failed to fetch members:', error)
    }
  }, [groupId])

  const fetchStudents = useCallback(async () => {
    try {
      const schoolId = profile?.schoolId
      console.log('[WhatsApp Groups] Fetching students for school:', schoolId)

      // Try with school_id first, then without if no results
      let params = schoolId ? `?school_id=${schoolId}&limit=500` : '?limit=500'
      let response = await fetch(`/api/students${params}`)

      if (response.ok) {
        let data = await response.json()
        console.log('[WhatsApp Groups] Students fetched with school_id:', data.data?.length || 0)

        // If no results and we had a school_id, try without it
        if ((data.data?.length || 0) === 0 && schoolId) {
          console.log('[WhatsApp Groups] Retrying without school_id filter...')
          response = await fetch('/api/students?limit=500')
          if (response.ok) {
            data = await response.json()
            console.log('[WhatsApp Groups] Students fetched without filter:', data.data?.length || 0)
          }
        }

        setStudents(data.data || [])
      } else {
        console.error('[WhatsApp Groups] Failed to fetch students:', response.status)
      }
    } catch (error) {
      console.error('Failed to fetch students:', error)
    }
  }, [profile?.schoolId])

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchGroup(), fetchMembers()])
      setLoading(false)
    }
    loadData()
  }, [fetchGroup, fetchMembers])

  // Fetch students separately when profile is available
  useEffect(() => {
    if (profile?.schoolId) {
      fetchStudents()
    }
  }, [profile?.schoolId, fetchStudents])

  const handleAddMembers = async () => {
    setAddingMembers(true)
    try {
      let membersToAdd: { member_type: string; student_id?: string; phone_number?: string; name?: string }[] = []

      if (addType === 'students') {
        membersToAdd = selectedStudents.map(studentId => {
          const student = students.find(s => s.id === studentId)
          return {
            member_type: 'student',
            student_id: studentId,
            phone_number: student?.phone || undefined,
            name: student ? `${student.first_name} ${student.last_name || ''}`.trim() : undefined,
          }
        })
      } else if (addType === 'custom' && customPhone) {
        membersToAdd = [{
          member_type: 'custom',
          phone_number: customPhone,
          name: customName || undefined,
        }]
      }

      if (membersToAdd.length === 0) {
        alert('Please select members to add')
        setAddingMembers(false)
        return
      }

      console.log('[GroupDetail] Adding members:', membersToAdd)
      const response = await fetch(`/api/whatsapp/groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: membersToAdd }),
      })

      const result = await response.json()
      console.log('[GroupDetail] Add members response:', result)

      if (response.ok) {
        await fetchMembers()
        await fetchGroup()
        setShowAddModal(false)
        setSelectedStudents([])
        setCustomPhone('')
        setCustomName('')
      } else {
        alert(result.error || 'Failed to add members')
      }
    } catch (error) {
      alert('Failed to add members')
    } finally {
      setAddingMembers(false)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Remove this member from the group?')) return

    try {
      const response = await fetch(`/api/whatsapp/groups/${groupId}/members?member_id=${memberId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchMembers()
        await fetchGroup()
      } else {
        alert('Failed to remove member')
      }
    } catch (error) {
      alert('Failed to remove member')
    }
  }

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const filteredStudents = students.filter(student => {
    const query = searchQuery.toLowerCase()
    const fullName = `${student.first_name} ${student.last_name || ''}`.toLowerCase()
    const admissionNo = student.admission_number?.toLowerCase() || ''
    return fullName.includes(query) || admissionNo.includes(query)
  })

  // Filter out already added students
  const availableStudents = filteredStudents.filter(
    student => !members.some(m => m.student_id === student.id)
  )

  // Debug logging
  console.log('[WhatsApp Groups] Students state:', students.length, 'Filtered:', filteredStudents.length, 'Available:', availableStudents.length)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Group not found</p>
        <Link href="/whatsapp/groups">
          <Button variant="outline" className="mt-4">Back to Groups</Button>
        </Link>
      </div>
    )
  }

  return (
    
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/whatsapp/groups">
            <Button variant="outline" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{group.name}</h1>
            <p className="text-gray-500 capitalize">{group.group_type} group • {members.length} members</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/whatsapp/send?group=${groupId}`}>
            <Button variant="outline" icon={<MessageSquare className="h-4 w-4" />}>
              Send Message
            </Button>
          </Link>
          <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>
            Add Members
          </Button>
        </div>
      </div>

      {/* Group Info */}
      {group.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-gray-600">{group.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No members in this group</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddModal(true)}
                icon={<UserPlus className="h-4 w-4" />}
              >
                Add Members
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {members.map(member => (
                <div key={member.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.name || 'Unknown'}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {member.phone_number && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {member.phone_number}
                          </span>
                        )}
                        <Badge variant="default" className="text-xs">
                          {member.member_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 hover:bg-red-50 rounded text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Members Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add Members</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 border-b">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setAddType('students')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    addType === 'students' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  From Students
                </button>
                <button
                  onClick={() => setAddType('custom')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    addType === 'custom' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Custom Number
                </button>
              </div>

              {addType === 'students' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {addType === 'custom' && (
                <div className="space-y-3">
                  <Input
                    label="Phone Number"
                    value={customPhone}
                    onChange={(e) => setCustomPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                  <Input
                    label="Name (Optional)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Contact name"
                  />
                </div>
              )}
            </div>

            {addType === 'students' && (
              <div className="overflow-y-auto max-h-[40vh]">
                {students.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>Loading students...</p>
                    <p className="text-xs mt-2">School ID: {profile?.schoolId || 'Not loaded'}</p>
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'No students found' : 'All students are already added'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableStudents.map(student => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedStudents.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 text-primary rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {student.first_name} {student.last_name || ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {student.admission_number}
                            {student.current_class?.name && ` • ${student.current_class.name}`}
                            {student.phone && ` • ${student.phone}`}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {addType === 'students'
                  ? `${selectedStudents.length} selected`
                  : customPhone ? '1 contact' : 'Enter phone number'}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddMembers}
                  loading={addingMembers}
                  disabled={addType === 'students' ? selectedStudents.length === 0 : !customPhone}
                >
                  Add Members
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  )
}
