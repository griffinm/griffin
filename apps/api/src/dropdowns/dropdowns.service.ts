import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Dropdown, DropdownInstance, DropdownOption } from '@prisma/client';
import { NewDropdownDto } from './dto/new-dropdown.dto';
import { UpdateDropdownDto } from './dto/update-dropdown.dto';
import { NewDropdownOptionDto } from './dto/new-dropdown-option.dto';
import { UpdateDropdownOptionDto } from './dto/update-dropdown-option.dto';
import { NewDropdownInstanceDto } from './dto/new-dropdown-instance.dto';
import { UpdateDropdownInstanceDto } from './dto/update-dropdown-instance.dto';

type DropdownWithOptions = Dropdown & { options: DropdownOption[] };

@Injectable()
export class DropdownsService {
  private readonly logger = new Logger(DropdownsService.name);

  constructor(private prisma: PrismaService) {}

  // ---- Definitions ----------------------------------------------------------

  async getAllForUser(userId: string): Promise<DropdownWithOptions[]> {
    return this.prisma.dropdown.findMany({
      where: { userId, deletedAt: null },
      include: {
        options: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: string, userId: string): Promise<DropdownWithOptions> {
    const dropdown = await this.prisma.dropdown.findFirst({
      where: { id, userId, deletedAt: null },
      include: {
        options: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
      },
    });
    if (!dropdown) {
      throw new NotFoundException('Dropdown not found');
    }
    return dropdown;
  }

  async create(userId: string, dto: NewDropdownDto): Promise<DropdownWithOptions> {
    const dropdown = await this.prisma.dropdown.create({
      data: { name: dto.name, userId },
    });

    if (dto.options?.length) {
      await this.prisma.dropdownOption.createMany({
        data: dto.options.map((option, index) => ({
          dropdownId: dropdown.id,
          label: option.label,
          color: option.color ?? 'gray',
          isDefault: option.isDefault ?? false,
          order: option.order ?? index,
        })),
      });
      await this.ensureSingleDefault(dropdown.id);
    }

    return this.getById(dropdown.id, userId);
  }

  async update(id: string, userId: string, dto: UpdateDropdownDto): Promise<DropdownWithOptions> {
    await this.assertOwnedDropdown(id, userId);
    await this.prisma.dropdown.update({ where: { id }, data: { name: dto.name } });
    return this.getById(id, userId);
  }

  /** Soft-delete a dropdown and cascade to its options and instances. */
  async deleteById(id: string, userId: string): Promise<Dropdown> {
    await this.assertOwnedDropdown(id, userId);
    const now = new Date();
    const [dropdown] = await this.prisma.$transaction([
      this.prisma.dropdown.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.dropdownOption.updateMany({
        where: { dropdownId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.dropdownInstance.updateMany({
        where: { dropdownId: id, deletedAt: null },
        data: { deletedAt: now },
      }),
    ]);
    return dropdown;
  }

  // ---- Options --------------------------------------------------------------

  async addOption(
    dropdownId: string,
    userId: string,
    dto: NewDropdownOptionDto,
  ): Promise<DropdownWithOptions> {
    await this.assertOwnedDropdown(dropdownId, userId);
    const count = await this.prisma.dropdownOption.count({
      where: { dropdownId, deletedAt: null },
    });
    const option = await this.prisma.dropdownOption.create({
      data: {
        dropdownId,
        label: dto.label,
        color: dto.color ?? 'gray',
        isDefault: dto.isDefault ?? false,
        order: dto.order ?? count,
      },
    });

    if (dto.isDefault === true) {
      await this.setDefault(dropdownId, option.id);
    } else {
      await this.ensureSingleDefault(dropdownId);
    }
    return this.getById(dropdownId, userId);
  }

  async updateOption(
    dropdownId: string,
    optionId: string,
    userId: string,
    dto: UpdateDropdownOptionDto,
  ): Promise<DropdownWithOptions> {
    await this.assertOwnedOption(dropdownId, optionId, userId);

    const { isDefault, ...rest } = dto;
    if (Object.keys(rest).length > 0) {
      await this.prisma.dropdownOption.update({ where: { id: optionId }, data: rest });
    }

    if (isDefault === true) {
      await this.setDefault(dropdownId, optionId);
    } else if (isDefault === false) {
      await this.prisma.dropdownOption.update({
        where: { id: optionId },
        data: { isDefault: false },
      });
      await this.ensureSingleDefault(dropdownId);
    }
    return this.getById(dropdownId, userId);
  }

  /**
   * Soft-delete an option. Any instances that had it selected fall back to the
   * default (we null their selection and resolve to the default at read time),
   * and if the deleted option was the default another option is promoted.
   */
  async deleteOption(
    dropdownId: string,
    optionId: string,
    userId: string,
  ): Promise<DropdownWithOptions> {
    await this.assertOwnedOption(dropdownId, optionId, userId);
    await this.prisma.dropdownOption.update({
      where: { id: optionId },
      data: { deletedAt: new Date() },
    });
    await this.prisma.dropdownInstance.updateMany({
      where: { dropdownId, selectedOptionId: optionId, deletedAt: null },
      data: { selectedOptionId: null },
    });
    await this.ensureSingleDefault(dropdownId);
    return this.getById(dropdownId, userId);
  }

  // ---- Instances ------------------------------------------------------------

  async createInstance(
    userId: string,
    dto: NewDropdownInstanceDto,
  ): Promise<DropdownInstance> {
    await this.assertOwnedDropdown(dto.dropdownId, userId);
    // New instances start unset (selectedOptionId null) and render the current
    // default; an explicit pick is stored when the user changes it.
    return this.prisma.dropdownInstance.create({
      data: { dropdownId: dto.dropdownId, noteId: dto.noteId, selectedOptionId: null },
    });
  }

  async getInstance(id: string, userId: string): Promise<DropdownInstance> {
    const instance = await this.prisma.dropdownInstance.findFirst({
      where: { id, deletedAt: null, dropdown: { userId } },
    });
    if (!instance) {
      throw new NotFoundException('Dropdown instance not found');
    }
    return instance;
  }

  async updateInstance(
    id: string,
    userId: string,
    dto: UpdateDropdownInstanceDto,
  ): Promise<DropdownInstance> {
    await this.getInstance(id, userId);
    const data =
      'selectedOptionId' in dto ? { selectedOptionId: dto.selectedOptionId ?? null } : {};
    return this.prisma.dropdownInstance.update({ where: { id }, data });
  }

  // ---- Helpers --------------------------------------------------------------

  private async assertOwnedDropdown(dropdownId: string, userId: string): Promise<void> {
    const dropdown = await this.prisma.dropdown.findFirst({
      where: { id: dropdownId, userId, deletedAt: null },
    });
    if (!dropdown) {
      throw new NotFoundException('Dropdown not found');
    }
  }

  private async assertOwnedOption(
    dropdownId: string,
    optionId: string,
    userId: string,
  ): Promise<void> {
    await this.assertOwnedDropdown(dropdownId, userId);
    const option = await this.prisma.dropdownOption.findFirst({
      where: { id: optionId, dropdownId, deletedAt: null },
    });
    if (!option) {
      throw new NotFoundException('Dropdown option not found');
    }
  }

  /** Make `optionId` the sole default among the dropdown's live options. */
  private async setDefault(dropdownId: string, optionId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.dropdownOption.updateMany({
        where: { dropdownId, deletedAt: null, id: { not: optionId } },
        data: { isDefault: false },
      }),
      this.prisma.dropdownOption.update({
        where: { id: optionId },
        data: { isDefault: true },
      }),
    ]);
  }

  /**
   * Guarantee exactly one default among the live options: keep the first
   * already-flagged one (by order) and clear the rest, or promote the
   * lowest-order option when none is flagged.
   */
  private async ensureSingleDefault(dropdownId: string): Promise<void> {
    const options = await this.prisma.dropdownOption.findMany({
      where: { dropdownId, deletedAt: null },
      orderBy: { order: 'asc' },
    });
    if (options.length === 0) return;

    const keep = options.find((o) => o.isDefault) ?? options[0];
    await this.prisma.$transaction([
      this.prisma.dropdownOption.updateMany({
        where: { dropdownId, deletedAt: null, id: { not: keep.id } },
        data: { isDefault: false },
      }),
      this.prisma.dropdownOption.update({
        where: { id: keep.id },
        data: { isDefault: true },
      }),
    ]);
  }
}
